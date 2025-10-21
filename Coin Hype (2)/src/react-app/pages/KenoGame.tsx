import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, TrendingUp, Star, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface KenoResult {
  selectedNumbers: number[];
  drawnNumbers: number[];
  matches: number[];
  payout: number;
  multiplier: number;
  hash: string;
}

const KENO_PAYOUTS: { [key: number]: { [key: number]: number } } = {
  1: { 1: 3.6 },
  2: { 1: 1, 2: 9 },
  3: { 1: 1, 2: 2, 3: 46 },
  4: { 1: 0.5, 2: 2, 3: 6, 4: 120 },
  5: { 2: 0.5, 3: 2, 4: 12, 5: 800 },
  6: { 3: 1, 4: 3, 5: 30, 6: 1600 },
  7: { 3: 0.5, 4: 1, 5: 6, 6: 100, 7: 7000 },
  8: { 4: 0.5, 5: 2, 6: 12, 7: 250, 8: 10000 },
  9: { 4: 0.5, 5: 1, 6: 5, 7: 50, 8: 1000, 9: 10000 },
  10: { 0: 2, 5: 1, 6: 2, 7: 15, 8: 200, 9: 1000, 10: 10000 }
};

export default function KenoGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastResult, setLastResult] = useState<KenoResult | null>(null);
  const [gameHistory, setGameHistory] = useState<KenoResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());

  // Generate numbers 1-80
  const allNumbers = Array.from({ length: 80 }, (_, i) => i + 1);

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`keno_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved keno history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`keno_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const toggleNumber = (number: number) => {
    if (isDrawing) return;
    
    setSelectedNumbers(prev => {
      if (prev.includes(number)) {
        return prev.filter(n => n !== number);
      } else if (prev.length < 10) {
        return [...prev, number].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  const clearSelection = () => {
    if (!isDrawing) {
      setSelectedNumbers([]);
    }
  };

  const quickPick = () => {
    if (!isDrawing) {
      const randomNumbers: number[] = [];
      while (randomNumbers.length < 10) {
        const num = Math.floor(Math.random() * 80) + 1;
        if (!randomNumbers.includes(num)) {
          randomNumbers.push(num);
        }
      }
      setSelectedNumbers(randomNumbers.sort((a, b) => a - b));
    }
  };

  const drawNumbers = async () => {
    if (selectedNumbers.length === 0 || currentBalance < currentBet || isDrawing) return;

    setIsDrawing(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct bet
    placeBet(currentBet);
    
    try {
      // Generate 20 random numbers using seeded random
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const seedNumber = parseInt(seed.slice(-8), 16);
      let rng = seedNumber;
      
      const seededRandom = () => {
        rng = (rng * 9301 + 49297) % 233280;
        return rng / 233280;
      };

      const drawn: number[] = [];
      const availableNumbers = [...allNumbers];
      
      for (let i = 0; i < 20; i++) {
        const randomIndex = Math.floor(seededRandom() * availableNumbers.length);
        drawn.push(availableNumbers[randomIndex]);
        availableNumbers.splice(randomIndex, 1);
      }

      // Animate drawing
      setDrawnNumbers([]);
      for (let i = 0; i < drawn.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setDrawnNumbers(prev => [...prev, drawn[i]]);
        soundManager.current.play('click');
      }

      // Calculate matches and payout
      const matches = selectedNumbers.filter(num => drawn.includes(num));
      const numMatches = matches.length;
      const numSelected = selectedNumbers.length;
      
      let multiplier = 0;
      if (KENO_PAYOUTS[numSelected] && KENO_PAYOUTS[numSelected][numMatches]) {
        multiplier = KENO_PAYOUTS[numSelected][numMatches];
      }
      
      const payout = currentBet * multiplier;

      const result: KenoResult = {
        selectedNumbers: [...selectedNumbers],
        drawnNumbers: drawn,
        matches,
        payout,
        multiplier,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      if (payout > 0) {
        addWin(payout);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Increment nonce
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/keno/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmount: currentBet,
              selectedNumbers: selectedNumbers,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Keno API error:', error);
        }
      }

    } catch (error) {
      console.error('Keno game error:', error);
    } finally {
      setIsDrawing(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Selected', 
      value: `${selectedNumbers.length}/10`, 
      color: 'text-blue-400',
      icon: <Grid className="w-3 h-3" />
    },
    { 
      label: 'Matches', 
      value: lastResult ? `${lastResult.matches.length}` : '0', 
      color: 'text-green-400',
      icon: <Star className="w-3 h-3" />
    },
    { 
      label: 'Multiplier', 
      value: lastResult ? `${lastResult.multiplier}x` : '0x', 
      color: 'text-purple-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Nonce', 
      value: `#${gameSeeds.nonce}`, 
      color: 'text-cyan-400',
      icon: <Hash className="w-3 h-3" />
    }
  ];

  return (
    <UniversalGameTemplate
      gameName="Keno"
      gameStats={gameStats}
      backgroundColor="from-green-900/20 via-blue-900/20 to-purple-900/20"
      actions={[
        {
          text: 'Quick Pick',
          onClick: quickPick,
          disabled: isDrawing,
          variant: 'secondary'
        },
        {
          text: 'Clear',
          onClick: clearSelection,
          disabled: isDrawing || selectedNumbers.length === 0,
          variant: 'secondary'
        },
        {
          text: isDrawing ? 'Drawing...' : `Draw Numbers - ◎ ${currentBet.toFixed(2)}`,
          onClick: drawNumbers,
          disabled: selectedNumbers.length === 0 || currentBalance < currentBet || isDrawing,
          loading: isDrawing
        }
      ]}
    >
      <div className="w-full max-w-lg mx-auto space-y-6">
        {/* Results Display */}
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-4 rounded-lg text-center"
          >
            <div className="text-lg font-bold text-white mb-2">
              {lastResult.matches.length} Matches
            </div>
            {lastResult.payout > 0 ? (
              <div className="text-green-400 font-semibold">
                Won: ◎ {lastResult.payout.toFixed(2)} ({lastResult.multiplier}x)
              </div>
            ) : (
              <div className="text-red-400">No Win</div>
            )}
          </motion.div>
        )}

        {/* Number Grid */}
        <div className="glass-panel p-4 rounded-lg">
          <div className="grid grid-cols-10 gap-1">
            {allNumbers.map((number) => {
              const isSelected = selectedNumbers.includes(number);
              const isDrawn = drawnNumbers.includes(number);
              const isMatch = lastResult?.matches.includes(number);
              
              return (
                <motion.button
                  key={number}
                  onClick={() => toggleNumber(number)}
                  disabled={isDrawing}
                  className={`
                    aspect-square text-xs font-bold rounded transition-all
                    ${isMatch ? 'bg-green-400 text-black' : 
                      isSelected ? 'bg-blue-400 text-white' :
                      isDrawn ? 'bg-white/20 text-white' :
                      'bg-white/5 text-white/70 hover:bg-white/10'}
                  `}
                  whileTap={{ scale: 0.9 }}
                  animate={isDrawn && !isSelected ? { scale: [1, 1.1, 1] } : {}}
                >
                  {number}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Drawn Numbers */}
        {drawnNumbers.length > 0 && (
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm text-white/70 mb-3 text-center">
              Drawn Numbers ({drawnNumbers.length}/20)
            </h3>
            <div className="flex flex-wrap justify-center gap-2">
              <AnimatePresence>
                {drawnNumbers.map((number, index) => (
                  <motion.div
                    key={number}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                      ${selectedNumbers.includes(number) ? 'bg-green-400 text-black' : 'bg-white/20 text-white'}
                    `}
                  >
                    {number}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Instructions */}
        {selectedNumbers.length === 0 && !lastResult && (
          <div className="text-center text-white/70 text-sm">
            <div className="text-lg mb-2">🎯</div>
            <div>Select 1-10 numbers</div>
            <div className="text-xs text-white/50 mt-1">We'll draw 20 numbers and pay based on matches</div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
