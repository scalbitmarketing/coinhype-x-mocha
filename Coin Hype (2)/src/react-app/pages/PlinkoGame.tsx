import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface PlinkoResult {
  ballPath: number[];
  multiplier: number;
  payout: number;
  win: boolean;
  betAmount: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

// Plinko multipliers for different risk levels
const MULTIPLIER_CONFIGS = {
  low: [1.5, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.5],
  medium: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
  high: [29, 4, 1.5, 1, 0.5, 1, 1.5, 4, 29]
};

const ROWS = 8; // Number of peg rows

export default function PlinkoGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setBet, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [isDropping, setIsDropping] = useState(false);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number } | null>(null);
  const [lastResult, setLastResult] = useState<PlinkoResult | null>(null);
  const [gameHistory, setGameHistory] = useState<PlinkoResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  const soundManager = useRef(new EnhancedSoundManager());
  const ballRef = useRef<HTMLDivElement>(null);

  // Load game history
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`plinko_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved plinko history:', e);
        }
      }
    }
  }, [user]);

  // Save history
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`plinko_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  // Generate provably fair ball path
  const generateBallPath = (serverSeed: string, clientSeed: string, nonce: number): number[] => {
    const path: number[] = [];
    let position = ROWS / 2; // Start in the middle
    
    for (let row = 0; row < ROWS; row++) {
      // Create deterministic random number using seeds
      const hashInput = `${serverSeed}:${clientSeed}:${nonce}:${row}`;
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        const char = hashInput.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      const random = Math.abs(hash) / 2147483647; // Normalize to 0-1
      
      // Move left or right based on random value
      if (random < 0.5) {
        position = Math.max(0, position - 0.5);
      } else {
        position = Math.min(ROWS, position + 0.5);
      }
      
      path.push(Math.floor(position));
    }
    
    return path;
  };

  const dropBall = async () => {
    if (currentBalance < currentBet || isDropping) return;

    setIsDropping(true);
    setPlaying(true);
    soundManager.current.play('click');
    
    // Deduct bet immediately
    placeBet(currentBet);

    try {
      // Generate ball path using provably fair logic
      const ballPath = generateBallPath(gameSeeds.serverSeed, gameSeeds.clientSeed, gameSeeds.nonce);
      const finalSlot = ballPath[ballPath.length - 1];
      
      // Get multiplier based on final slot and risk level
      const multipliers = MULTIPLIER_CONFIGS[riskLevel];
      const multiplier = multipliers[Math.min(finalSlot, multipliers.length - 1)];
      const payout = currentBet * multiplier;

      // Animate ball dropping
      setBallPosition({ x: 50, y: 0 }); // Start at top center
      
      // Simulate ball bouncing through pegs
      for (let i = 0; i < ballPath.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setBallPosition({
          x: (ballPath[i] / ROWS) * 100,
          y: ((i + 1) / ROWS) * 80
        });
        soundManager.current.play('click');
      }

      const result: PlinkoResult = {
        ballPath,
        multiplier,
        payout,
        win: multiplier > 1,
        betAmount: currentBet,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`,
        serverSeed: gameSeeds.serverSeed,
        clientSeed: gameSeeds.clientSeed,
        nonce: gameSeeds.nonce
      };

      // Add winnings if applicable
      if (result.win) {
        addWin(payout);
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Increment nonce for next game
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      // API call for real mode
      if (isRealMode) {
        try {
          await fetch('/api/games/plinko/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              riskLevel,
              serverSeed: result.serverSeed,
              clientSeed: result.clientSeed,
              nonce: result.nonce,
              ballPath: result.ballPath
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Plinko API error:', error);
        }
      }

    } catch (error) {
      console.error('Plinko game error:', error);
    } finally {
      setIsDropping(false);
      setPlaying(false);
      setTimeout(() => setBallPosition(null), 2000);
    }
  };

  const gameStats = [
    { 
      label: 'Risk Level', 
      value: riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1), 
      color: riskLevel === 'low' ? 'text-green-400' : riskLevel === 'medium' ? 'text-yellow-400' : 'text-red-400' 
    },
    { label: 'Rows', value: ROWS.toString(), color: 'text-cyan-400' },
    { label: 'Max Multiplier', value: `${Math.max(...MULTIPLIER_CONFIGS[riskLevel])}x`, color: 'text-purple-400' },
    { label: 'Nonce', value: `#${gameSeeds.nonce}`, color: 'text-gray-400' }
  ];

  const currentMultipliers = MULTIPLIER_CONFIGS[riskLevel];

  return (
    <UniversalGameTemplate
      gameName="Plinko"
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-purple-900/20 via-pink-900/20 to-blue-900/20"
      actions={[
        {
          text: isDropping ? 'Dropping...' : `Drop Ball - ◎ ${currentBet.toFixed(2)}`,
          onClick: dropBall,
          disabled: currentBalance < currentBet || isDropping,
          loading: isDropping
        }
      ]}
      customBetInput={
        <div className="space-y-4">
          {/* Bet amount input */}
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <label className="block text-xs text-white/70 mb-1">Bet Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={currentBet}
                  onChange={(e) => setBet(Math.max(0.01, Math.min(Number(e.target.value), currentBalance)))}
                  min="0.01"
                  max={currentBalance}
                  step="0.01"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 pr-12 text-sm"
                  placeholder="0.01"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/50">◎</span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setBet(currentBet / 2)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                ½
              </button>
              <button
                onClick={() => setBet(Math.min(currentBet * 2, currentBalance))}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                2×
              </button>
              <button
                onClick={() => setBet(currentBalance)}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-sm font-semibold text-white transition-colors"
              >
                Max
              </button>
            </div>
          </div>

          {/* Risk level selection */}
          <div>
            <label className="block text-xs text-white/70 mb-2">Risk Level</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  disabled={isDropping}
                  className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                    riskLevel === level
                      ? level === 'low' 
                        ? 'bg-green-500/30 border border-green-400 text-green-400'
                        : level === 'medium'
                        ? 'bg-yellow-500/30 border border-yellow-400 text-yellow-400'
                        : 'bg-red-500/30 border border-red-400 text-red-400'
                      : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto">
        {/* Plinko Board */}
        <div className="glass-panel p-6 relative overflow-hidden rounded-2xl">
          <div className="relative w-full h-96 bg-gradient-to-b from-purple-900/20 to-blue-900/20 rounded-lg">
            {/* Pegs */}
            <div className="absolute inset-0">
              {Array.from({ length: ROWS }, (_, row) => (
                <div key={row} className="absolute w-full flex justify-center" style={{ top: `${(row + 1) * (80 / ROWS)}%` }}>
                  {Array.from({ length: row + 2 }, (_, peg) => (
                    <div
                      key={peg}
                      className="w-2 h-2 bg-white/60 rounded-full mx-2"
                      style={{
                        transform: `translateX(${(peg - (row + 1) / 2) * 20}px)`
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* Animated Ball */}
            <AnimatePresence>
              {ballPosition && (
                <motion.div
                  ref={ballRef}
                  className="absolute w-4 h-4 bg-gradient-to-br from-cyan-400 to-pink-500 rounded-full shadow-lg"
                  style={{
                    left: `${ballPosition.x}%`,
                    top: `${ballPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.8))'
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{
                    scale: { duration: 0.2, repeat: Infinity },
                    rotate: { duration: 0.5, ease: "linear", repeat: Infinity }
                  }}
                />
              )}
            </AnimatePresence>

            {/* Multiplier Slots */}
            <div className="absolute bottom-0 left-0 right-0 flex">
              {currentMultipliers.map((multiplier, index) => (
                <div
                  key={index}
                  className={`flex-1 h-12 flex items-center justify-center text-xs font-bold border-l border-white/20 ${
                    multiplier > 1 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  } ${lastResult && index === Math.min(lastResult.ballPath[lastResult.ballPath.length - 1], currentMultipliers.length - 1) ? 'ring-2 ring-cyan-400' : ''}`}
                >
                  {multiplier}x
                </div>
              ))}
            </div>
          </div>

          {/* Result Display */}
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 text-center"
            >
              <div className={`text-2xl font-bold mb-2 ${
                lastResult.win ? 'text-green-400' : 'text-red-400'
              }`}>
                {lastResult.multiplier}x Multiplier
              </div>
              {lastResult.win && (
                <div className="text-lg text-green-400 font-semibold">
                  Won: ◎ {lastResult.payout.toFixed(2)}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Game History */}
        <div className="mt-6 glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Results</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameHistory.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  result.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span>{result.multiplier}x</span>
                <span>
                  {result.win ? '+' : '-'}◎ {result.win ? result.payout.toFixed(2) : result.betAmount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UniversalGameTemplate>
  );
}
