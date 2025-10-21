import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Star, Hash } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface Lucky7sResult {
  reels: [string, string, string];
  multiplier: number;
  payout: number;
  winType: string;
  hash: string;
}

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const SYMBOL_WEIGHTS = [25, 20, 18, 15, 12, 8, 2]; // 7️⃣ is rarest

const PAYOUTS: { [key: string]: number } = {
  '🍒🍒🍒': 5,
  '🍋🍋🍋': 8,
  '🍊🍊🍊': 12,
  '🍇🍇🍇': 20,
  '⭐⭐⭐': 50,
  '💎💎💎': 100,
  '7️⃣7️⃣7️⃣': 777,
  '7️⃣7️⃣_': 10,  // Two 7s
  '7️⃣__': 3,     // One 7
  '_7️⃣_': 3,     // One 7 middle
  '__7️⃣': 3      // One 7 right
};

export default function Lucky7sGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [reels, setReels] = useState<[string, string, string]>(['7️⃣', '7️⃣', '7️⃣']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<Lucky7sResult | null>(null);
  const [gameHistory, setGameHistory] = useState<Lucky7sResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`lucky7s_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved lucky 7s history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`lucky7s_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  const getRandomSymbol = (seedValue: number): string => {
    const totalWeight = SYMBOL_WEIGHTS.reduce((sum, weight) => sum + weight, 0);
    let random = (seedValue % totalWeight);
    
    for (let i = 0; i < SYMBOLS.length; i++) {
      random -= SYMBOL_WEIGHTS[i];
      if (random <= 0) {
        return SYMBOLS[i];
      }
    }
    
    return SYMBOLS[0]; // Fallback
  };

  const calculatePayout = (reels: [string, string, string]): { multiplier: number; winType: string } => {
    const reelString = reels.join('');
    
    // Check for exact matches first
    if (PAYOUTS[reelString]) {
      return { multiplier: PAYOUTS[reelString], winType: reelString };
    }
    
    // Check for 7s patterns
    const sevenCount = reels.filter(symbol => symbol === '7️⃣').length;
    if (sevenCount === 2) {
      return { multiplier: 10, winType: 'Two 7s' };
    } else if (sevenCount === 1) {
      return { multiplier: 3, winType: 'One 7' };
    }
    
    return { multiplier: 0, winType: 'No Win' };
  };

  const spinReels = async () => {
    if (currentBalance < currentBet || isSpinning) return;

    setIsSpinning(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct bet
    placeBet(currentBet);
    
    try {
      // Generate final reels using seeded random
      const seed = `${gameSeeds.serverSeed}${gameSeeds.clientSeed}${gameSeeds.nonce}`;
      const seedNumber = parseInt(seed.slice(-8), 16);
      
      const finalReels: [string, string, string] = [
        getRandomSymbol(seedNumber % 10000),
        getRandomSymbol((seedNumber * 7) % 10000),
        getRandomSymbol((seedNumber * 13) % 10000)
      ];

      // Animate spinning
      for (let i = 0; i < 20; i++) {
        const randomReels: [string, string, string] = [
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
          SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
        ];
        setReels(randomReels);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Set final result
      setReels(finalReels);
      await new Promise(resolve => setTimeout(resolve, 500));

      const { multiplier, winType } = calculatePayout(finalReels);
      const payout = currentBet * multiplier;

      const result: Lucky7sResult = {
        reels: finalReels,
        multiplier,
        payout,
        winType,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`
      };

      if (payout > 0) {
        addWin(payout);
        if (multiplier >= 100) {
          soundManager.current.play('win');
        } else {
          soundManager.current.play('win');
        }
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
          await fetch('/api/games/lucky7s/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmount: currentBet,
              reels: finalReels,
              multiplier,
              serverSeed: result.hash.split(':')[0],
              clientSeed: result.hash.split(':')[1],
              nonce: parseInt(result.hash.split(':')[2])
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Lucky 7s API error:', error);
        }
      }

    } catch (error) {
      console.error('Lucky 7s game error:', error);
    } finally {
      setIsSpinning(false);
      setPlaying(false);
    }
  };

  const gameStats = [
    { 
      label: 'Last Win', 
      value: lastResult ? `${lastResult.multiplier}x` : '0x', 
      color: lastResult?.multiplier === 777 ? 'text-yellow-400' : 'text-green-400',
      icon: <TrendingUp className="w-3 h-3" />
    },
    { 
      label: 'Payout', 
      value: lastResult ? `◎ ${lastResult.payout.toFixed(2)}` : '◎ 0.00', 
      color: 'text-blue-400',
      icon: <Star className="w-3 h-3" />
    },
    { 
      label: 'Jackpot', 
      value: '777x', 
      color: 'text-yellow-400',
      icon: <Zap className="w-3 h-3" />
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
      gameName="Lucky 7s"
      gameStats={gameStats}
      backgroundColor="from-yellow-900/20 via-orange-900/20 to-red-900/20"
      actions={[
        {
          text: isSpinning ? 'Spinning...' : `Spin Reels - ◎ ${currentBet.toFixed(2)}`,
          onClick: spinReels,
          disabled: currentBalance < currentBet || isSpinning,
          loading: isSpinning
        }
      ]}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Slot Machine */}
        <div className="glass-panel p-6 rounded-lg relative overflow-hidden">
          {/* Neon Border */}
          <div className="absolute inset-0 rounded-lg border-2 border-yellow-400/50 animate-pulse" />
          
          {/* Reels */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            {reels.map((symbol, index) => (
              <motion.div
                key={index}
                className="w-20 h-20 bg-black/50 rounded-lg flex items-center justify-center text-4xl border-2 border-yellow-400/30"
                animate={isSpinning ? { y: [-10, 10, -10] } : {}}
                transition={{ 
                  duration: 0.2, 
                  repeat: isSpinning ? Infinity : 0,
                  delay: index * 0.1
                }}
              >
                {symbol}
              </motion.div>
            ))}
          </div>

          {/* Classic Slot Machine Details */}
          <div className="text-center">
            <div className="text-xs text-yellow-400 mb-2">★ LUCKY 7s SLOTS ★</div>
            {lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-lg font-bold ${
                  lastResult.multiplier === 777 ? 'text-yellow-400 animate-pulse' :
                  lastResult.multiplier > 0 ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {lastResult.winType}
                {lastResult.multiplier > 0 && (
                  <div className="text-sm">
                    {lastResult.multiplier}x = ◎ {lastResult.payout.toFixed(2)}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Paytable */}
        <div className="glass-panel p-4 rounded-lg">
          <h3 className="text-sm text-white/70 mb-3 text-center">Paytable</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>7️⃣ 7️⃣ 7️⃣</span>
              <span className="text-yellow-400 font-bold">777x</span>
            </div>
            <div className="flex justify-between">
              <span>💎 💎 💎</span>
              <span className="text-blue-400">100x</span>
            </div>
            <div className="flex justify-between">
              <span>⭐ ⭐ ⭐</span>
              <span className="text-purple-400">50x</span>
            </div>
            <div className="flex justify-between">
              <span>🍇 🍇 🍇</span>
              <span className="text-green-400">20x</span>
            </div>
            <div className="flex justify-between">
              <span>Any two 7️⃣</span>
              <span className="text-orange-400">10x</span>
            </div>
            <div className="flex justify-between">
              <span>Any single 7️⃣</span>
              <span className="text-yellow-300">3x</span>
            </div>
          </div>
        </div>

        {/* Recent Spins */}
        {gameHistory.length > 0 && (
          <div className="glass-panel p-4 rounded-lg">
            <h3 className="text-sm text-white/70 mb-3 text-center">Recent Spins</h3>
            <div className="space-y-2">
              {gameHistory.slice(0, 5).map((result, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <div className="flex space-x-1">
                    {result.reels.map((symbol, i) => (
                      <span key={i} className="text-lg">{symbol}</span>
                    ))}
                  </div>
                  <span className={`font-bold ${
                    result.multiplier === 777 ? 'text-yellow-400' :
                    result.multiplier > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {result.multiplier > 0 ? `${result.multiplier}x` : 'Loss'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        {!lastResult && gameHistory.length === 0 && (
          <div className="glass-panel p-4 rounded-lg text-center">
            <div className="text-4xl mb-2">🎰</div>
            <div className="text-sm text-white/70 mb-2">Classic 7s Slot Machine</div>
            <div className="text-xs text-white/50 space-y-1">
              <div>• Match 3 symbols for big wins</div>
              <div>• 7s pay even with partial matches</div>
              <div>• Triple 7s = 777x JACKPOT!</div>
              <div>• Retro neon slot experience</div>
            </div>
          </div>
        )}
      </div>
    </UniversalGameTemplate>
  );
}
