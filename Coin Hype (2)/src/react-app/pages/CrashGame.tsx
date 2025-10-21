import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateCrashMultiplier, generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';

interface CrashGameResult {
  crashPoint: number;
  cashoutMultiplier: number | null;
  payout: number;
  win: boolean;
  betAmount: number;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

type GamePhase = 'betting' | 'countdown' | 'flying' | 'crashed' | 'finished';

const BETTING_WINDOW = 5; // seconds

export default function CrashGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  // Game state
  const [gamePhase, setGamePhase] = useState<GamePhase>('betting');
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [crashMultiplier, setCrashMultiplier] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(BETTING_WINDOW);
  
  // Player state
  const [hasBet, setHasBet] = useState(false);
  const [cashedOut, setCashedOut] = useState(false);
  const [cashoutMultiplier, setCashoutMultiplier] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<CrashGameResult | null>(null);
  
  // History and UI
  const [gameHistory, setGameHistory] = useState<CrashGameResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  
  // Refs for intervals and sound
  const soundManager = useRef(new EnhancedSoundManager());
  const gameInterval = useRef<NodeJS.Timeout | null>(null);
  const phaseInterval = useRef<NodeJS.Timeout | null>(null);
  const multiplierStartTime = useRef<number>(0);

  // Load game history from localStorage
  useEffect(() => {
    if (user) {
      const savedHistory = localStorage.getItem(`crash_history_${user.id}`);
      if (savedHistory) {
        try {
          setGameHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse saved crash history:', e);
        }
      }
    }
  }, [user]);

  // Save history to localStorage
  useEffect(() => {
    if (user && gameHistory.length > 0) {
      localStorage.setItem(`crash_history_${user.id}`, JSON.stringify(gameHistory.slice(0, 50)));
    }
  }, [gameHistory, user]);

  // Clear all intervals
  const clearAllIntervals = () => {
    if (gameInterval.current) {
      clearInterval(gameInterval.current);
      gameInterval.current = null;
    }
    if (phaseInterval.current) {
      clearInterval(phaseInterval.current);
      phaseInterval.current = null;
    }
  };

  // Start new round
  const startRound = () => {
    clearAllIntervals();
    
    // Generate provably fair crash point
    const crashResult = generateCrashMultiplier(gameSeeds.serverSeed, gameSeeds.clientSeed, gameSeeds.nonce);
    
    // Reset state
    setGamePhase('betting');
    setCurrentMultiplier(1.0);
    setCrashMultiplier(crashResult.result);
    setTimeLeft(BETTING_WINDOW);
    setHasBet(false);
    setCashedOut(false);
    setCashoutMultiplier(null);
    
    // Start betting countdown
    phaseInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (phaseInterval.current) {
            clearInterval(phaseInterval.current);
            phaseInterval.current = null;
          }
          startFlying(crashResult.result);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start flying phase
  const startFlying = (crashPoint: number) => {
    setGamePhase('flying');
    setTimeLeft(0);
    multiplierStartTime.current = Date.now();
    
    // Start multiplier animation
    gameInterval.current = setInterval(() => {
      const elapsed = (Date.now() - multiplierStartTime.current) / 1000;
      const newMultiplier = 1 + elapsed * 0.1 + elapsed * elapsed * 0.01;
      
      if (newMultiplier >= crashPoint) {
        crashRocket(crashPoint);
      } else {
        setCurrentMultiplier(newMultiplier);
      }
    }, 50);
  };

  // Crash the rocket
  const crashRocket = (crashPoint: number) => {
    clearAllIntervals();
    setGamePhase('crashed');
    setCurrentMultiplier(crashPoint);
    
    // Process result for player if they had a bet
    if (hasBet) {
      const win = cashedOut;
      const payout = win ? currentBet * (cashoutMultiplier || 1) : 0;
      
      const result: CrashGameResult = {
        crashPoint,
        cashoutMultiplier: win ? (cashoutMultiplier || null) : null,
        payout,
        win,
        betAmount: currentBet,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`,
        serverSeed: gameSeeds.serverSeed,
        clientSeed: gameSeeds.clientSeed,
        nonce: gameSeeds.nonce
      };
      
      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 49)]);
      
      // Play appropriate sound
      if (win) {
        soundManager.current.play('win');
      } else {
        soundManager.current.play('lose');
      }
      
      // Increment nonce for next round
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));
    }
    
    // Move to finished state after a delay
    setTimeout(() => {
      setGamePhase('finished');
      setTimeout(() => {
        startRound();
      }, 2000);
    }, 2000);
  };

  // Place bet during betting phase
  const placeBetForRound = async () => {
    if (currentBalance < currentBet || hasBet || gamePhase !== 'betting') return;
    
    setHasBet(true);
    soundManager.current.play('click');
    
    // Always deduct bet from balance immediately
    placeBet(currentBet);
  };

  // Cash out during flying phase
  const cashOut = async () => {
    if (!hasBet || cashedOut || gamePhase !== 'flying' || currentMultiplier < 1.01) {
      return;
    }
    
    setCashedOut(true);
    setCashoutMultiplier(currentMultiplier);
    const payout = currentBet * currentMultiplier;
    
    soundManager.current.play('cashout');
    
    try {
      if (isRealMode) {
        const response = await fetch('/api/games/crash/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            betAmountSol: currentBet,
            crashPoint: crashMultiplier || 100,
            userCashout: currentMultiplier,
            serverSeed: gameSeeds.serverSeed,
            clientSeed: gameSeeds.clientSeed,
            nonce: gameSeeds.nonce
          }),
        });

        if (response.ok) {
          await refreshBalance();
        }
      } else {
        // Add winnings in demo mode
        addWin(payout);
      }
    } catch (error) {
      console.error('Cashout error:', error);
    }
  };

  // Start the first round on component mount
  useEffect(() => {
    startRound();
    
    // Cleanup on unmount
    return () => {
      clearAllIntervals();
    };
  }, []);

  const getMultiplierColor = () => {
    if (gamePhase === 'crashed') return 'text-red-400';
    if (currentMultiplier < 2) return 'text-green-400';
    if (currentMultiplier < 5) return 'text-yellow-400';
    if (currentMultiplier < 10) return 'text-orange-400';
    return 'text-red-400';
  };

  const gameStats = [
    { label: 'Phase', value: gamePhase.charAt(0).toUpperCase() + gamePhase.slice(1), color: 'text-cyan-400' },
    { label: 'Time Left', value: gamePhase === 'betting' ? `${timeLeft}s` : '-', color: 'text-blue-400' },
    { label: 'Current', value: `${currentMultiplier.toFixed(2)}x`, color: getMultiplierColor().replace('text-', '') },
    { label: 'Nonce', value: `#${gameSeeds.nonce}`, color: 'text-gray-400' }
  ];

  const getPhaseMessage = () => {
    switch (gamePhase) {
      case 'betting':
        return `Place your bets! ${timeLeft}s remaining`;
      case 'countdown':
        return `Starting in ${timeLeft}s...`;
      case 'flying':
        return 'Rocket is flying! Cash out before it crashes!';
      case 'crashed':
        return `Crashed at ${currentMultiplier.toFixed(2)}x`;
      case 'finished':
        return 'Round finished. Next round starting soon...';
      default:
        return '';
    }
  };

  const getActionButton = () => {
    if (gamePhase === 'betting' && !hasBet) {
      return {
        text: `Place Bet - ◎ ${currentBet.toFixed(2)}`,
        onClick: placeBetForRound,
        disabled: currentBalance < currentBet,
        loading: false
      };
    }
    
    if (gamePhase === 'betting' && hasBet) {
      return {
        text: `Bet Placed - ◎ ${currentBet.toFixed(2)}`,
        onClick: () => {},
        disabled: true,
        loading: false
      };
    }
    
    if (gamePhase === 'flying' && hasBet && !cashedOut) {
      return {
        text: `Cash Out - ◎ ${(currentBet * currentMultiplier).toFixed(2)}`,
        onClick: cashOut,
        disabled: currentMultiplier < 1.01,
        loading: false
      };
    }
    
    if (cashedOut) {
      return {
        text: `Cashed Out at ${cashoutMultiplier?.toFixed(2)}x`,
        onClick: () => {},
        disabled: true,
        loading: false
      };
    }
    
    return {
      text: 'Waiting for next round...',
      onClick: () => {},
      disabled: true,
      loading: false
    };
  };

  return (
    <UniversalGameTemplate
      gameName="Crash"
      gameStats={gameStats}
      backgroundColor="from-orange-900/20 via-red-900/20 to-pink-900/20"
      actions={[getActionButton()]}
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Status Message */}
        <div className="glass-panel p-4 text-center">
          <div className="text-sm text-gray-400 mb-2">{getPhaseMessage()}</div>
          {gamePhase === 'betting' && (
            <div className="text-2xl font-bold text-blue-400">{timeLeft}s</div>
          )}
        </div>

        {/* Rocket Animation */}
        <div className="glass-panel p-8 relative overflow-hidden h-64">
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="text-8xl relative"
              style={{
                filter: gamePhase === 'crashed' 
                  ? 'drop-shadow(0 0 25px rgba(239, 68, 68, 0.8))'
                  : gamePhase === 'flying'
                  ? 'drop-shadow(0 0 15px rgba(0, 217, 255, 0.6))'
                  : 'drop-shadow(0 0 10px rgba(0, 217, 255, 0.4))'
              }}
              animate={
                gamePhase === 'flying' ? {
                  y: [0, -20, -40, -60],
                  rotate: [0, 2, -2, 1]
                } : gamePhase === 'crashed' ? {
                  rotate: [0, 45],
                  scale: [1, 0.8]
                } : {}
              }
              transition={{
                duration: gamePhase === 'flying' ? 5 : 0.5,
                ease: gamePhase === 'flying' ? "easeOut" : "easeIn"
              }}
            >
              🚀
            </motion.div>
            
            {/* Rocket Trail */}
            {gamePhase === 'flying' && (
              <motion.div
                className="absolute bottom-1/3 w-3 rounded-full"
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: ['20px', '40px', '60px'],
                  opacity: [0.6, 1, 0.8]
                }}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  background: 'linear-gradient(to top, rgba(249, 115, 22, 0.8), transparent)',
                  filter: 'blur(1px)'
                }}
              />
            )}
          </div>

          {/* Multiplier Display */}
          <div className="absolute inset-0 flex items-end justify-center pb-8">
            <motion.div
              className={`text-6xl font-bold ${getMultiplierColor()}`}
              style={{
                filter: gamePhase === 'crashed' 
                  ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8))'
                  : 'drop-shadow(0 0 15px rgba(6, 182, 212, 0.6))'
              }}
              animate={gamePhase === 'flying' ? { 
                scale: [1, 1.02, 1]
              } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {currentMultiplier.toFixed(2)}x
            </motion.div>
          </div>
        </div>

        {/* Result Display */}
        {gamePhase === 'crashed' && lastResult && (
          <div className="glass-panel p-4 text-center">
            <div className="text-2xl text-red-400 font-bold mb-2">CRASHED!</div>
            <div className={`text-lg font-bold ${lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
              {lastResult.win 
                ? `+◎ ${lastResult.payout.toFixed(2)}`
                : `-◎ ${lastResult.betAmount.toFixed(2)}`
              }
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Crashes</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameHistory.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  result.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span>
                  {result.cashoutMultiplier 
                    ? `${result.cashoutMultiplier.toFixed(2)}x` 
                    : `${result.crashPoint.toFixed(2)}x`
                  }
                </span>
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
