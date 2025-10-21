import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import BetControls from '@/react-app/components/BetControls';
import Logo from '@/react-app/components/Logo';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import SoundManager from '@/react-app/utils/sounds';

interface CrossroadsGameState {
  isSpinning: boolean;
  currentDirection: 'north' | 'south' | 'east' | 'west' | null;
  selectedDirection: 'north' | 'south' | 'east' | 'west' | null;
  lastResult: {
    direction: string;
    multiplier: number;
    win: boolean;
    payout: number;
  } | null;
  gameHistory: Array<{
    direction: string;
    multiplier: number;
    win: boolean;
    payout: number;
    bet: number;
  }>;
}

export default function CrossroadsGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [gameState, setGameState] = useState<CrossroadsGameState>({
    isSpinning: false,
    currentDirection: null,
    selectedDirection: null,
    lastResult: null,
    gameHistory: []
  });
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const directions = [
    { id: 'north' as const, label: 'North', multiplier: 2, angle: 0, icon: '⬆️' },
    { id: 'east' as const, label: 'East', multiplier: 3, angle: 90, icon: '➡️' },
    { id: 'south' as const, label: 'South', multiplier: 2, angle: 180, icon: '⬇️' },
    { id: 'west' as const, label: 'West', multiplier: 3, angle: 270, icon: '⬅️' }
  ];

  const selectDirection = (direction: 'north' | 'south' | 'east' | 'west') => {
    if (gameState.isSpinning) return;
    setGameState(prev => ({ ...prev, selectedDirection: direction }));
    playSound('click');
  };

  const spin = async () => {
    if (gameState.isSpinning || !gameState.selectedDirection || currentBet > currentBalance) return;
    
    setGameState(prev => ({ ...prev, isSpinning: true }));
    setPlaying(true);
    playSound('click');
    
    if (!isRealMode) {
      placeBet(currentBet);
    }

    // FIXED: Generate random direction with proper weighted probabilities
    const random = Math.random();
    let finalDirection: 'north' | 'south' | 'east' | 'west';
    
    // Proper house edge: North/South 45% each (2x), East/West 5% each (3x)
    if (random < 0.45) {
      finalDirection = 'north';
    } else if (random < 0.90) {
      finalDirection = 'south';
    } else if (random < 0.95) {
      finalDirection = 'east';
    } else {
      finalDirection = 'west';
    }
    
    const selectedDir = directions.find(d => d.id === gameState.selectedDirection)!;
    const resultDir = directions.find(d => d.id === finalDirection)!;
    
    setTimeout(async () => {
      setGameState(prev => ({ ...prev, currentDirection: finalDirection }));
      
      const win = gameState.selectedDirection === finalDirection;
      const multiplier = win ? selectedDir.multiplier : 0;
      const payout = win ? currentBet * multiplier : 0;
      
      const result = {
        direction: resultDir.label,
        multiplier,
        win,
        payout
      };

      setGameState(prev => ({
        ...prev,
        lastResult: result,
        gameHistory: [{ ...result, bet: currentBet }, ...prev.gameHistory.slice(0, 9)],
        isSpinning: false,
        selectedDirection: null
      }));

      if (win) {
        playSound('win');
        if (!isRealMode) {
          addWin(payout);
        }
      }

      if (isRealMode) {
        try {
          await fetch('/api/games/crossroads/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              selectedDirection: gameState.selectedDirection,
              resultDirection: finalDirection,
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Crossroads game error:', error);
        }
      }

      setPlaying(false);
    }, 2000);
  };

  return (
    <GameBackground theme="crossroads">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-10 relative"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </button>
          
          <div className="flex-1 flex justify-center">
            <Logo size="medium" />
          </div>
          
          <div className="flex-shrink-0">
            <BalanceDisplay />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Game Controls */}
          <div className="space-y-6">
            <div className="glass-panel p-6">
              <BetControls disabled={gameState.isSpinning} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Choose Direction</h3>
              <div className="grid grid-cols-2 gap-3">
                {directions.map((direction) => (
                  <button
                    key={direction.id}
                    onClick={() => selectDirection(direction.id)}
                    disabled={gameState.isSpinning}
                    className={`p-4 rounded-lg border-2 transition-all font-bold text-sm ${
                      gameState.selectedDirection === direction.id
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                        : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                    } disabled:opacity-50`}
                  >
                    <div className="text-2xl mb-1">{direction.icon}</div>
                    <div>{direction.label}</div>
                    <div className="text-xs text-gray-400">{direction.multiplier}x</div>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={spin}
              disabled={!gameState.selectedDirection || currentBet > currentBalance || gameState.isSpinning}
              className={`w-full p-4 text-lg font-bold rounded-lg transition-all ${
                !gameState.selectedDirection || currentBet > currentBalance
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'neon-button'
              }`}
              whileHover={gameState.selectedDirection && currentBet <= currentBalance && !gameState.isSpinning ? { scale: 1.02 } : {}}
              whileTap={gameState.selectedDirection && currentBet <= currentBalance && !gameState.isSpinning ? { scale: 0.98 } : {}}
            >
              {gameState.isSpinning ? (
                <div className="flex items-center justify-center space-x-2">
                  <TrendingUp className="w-5 h-5 animate-spin" />
                  <span>Finding Direction...</span>
                </div>
              ) : (
                'Choose Your Path'
              )}
            </motion.button>
          </div>

          {/* Game Display */}
          <div className="glass-panel p-8 flex flex-col items-center justify-center">
            <div className="relative w-80 h-80">
              {/* Crossroads visual */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-64 h-64">
                  {/* Roads */}
                  <div className="absolute top-0 left-1/2 w-8 h-full bg-gray-600 transform -translate-x-1/2"></div>
                  <div className="absolute left-0 top-1/2 w-full h-8 bg-gray-600 transform -translate-y-1/2"></div>
                  
                  {/* Center circle */}
                  <div className="absolute top-1/2 left-1/2 w-16 h-16 bg-gray-800 rounded-full border-4 border-cyan-400 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    <motion.div
                      className="text-2xl"
                      animate={{
                        rotate: gameState.isSpinning ? 360 : 0
                      }}
                      transition={{
                        duration: gameState.isSpinning ? 2 : 0,
                        ease: "easeOut"
                      }}
                    >
                      🧭
                    </motion.div>
                  </div>

                  {/* Direction indicators */}
                  {directions.map((direction) => (
                    <motion.div
                      key={direction.id}
                      className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center text-xl font-bold ${
                        gameState.currentDirection === direction.id
                          ? 'border-green-400 bg-green-400/20 text-green-400'
                          : gameState.selectedDirection === direction.id
                          ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                          : 'border-gray-500 bg-gray-700/50 text-gray-400'
                      }`}
                      style={{
                        top: direction.id === 'north' ? '10px' : direction.id === 'south' ? 'calc(100% - 58px)' : '50%',
                        left: direction.id === 'west' ? '10px' : direction.id === 'east' ? 'calc(100% - 58px)' : '50%',
                        transform: direction.id === 'north' || direction.id === 'south' ? 'translateX(-50%)' : 'translateY(-50%)'
                      }}
                      initial={{ scale: 1 }}
                      animate={{
                        scale: gameState.currentDirection === direction.id ? 1.2 : 1,
                        borderColor: gameState.currentDirection === direction.id ? '#10b981' : undefined
                      }}
                    >
                      {direction.icon}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {gameState.lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-6 text-center"
              >
                <div className={`text-2xl font-bold mb-2 ${gameState.lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.lastResult.direction}
                </div>
                <div className={`text-xl font-bold ${gameState.lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
                  {gameState.lastResult.win ? 
                    `+${isRealMode ? '◎' : '$'}${gameState.lastResult.payout.toFixed(isRealMode ? 4 : 2)}` : 
                    `-${isRealMode ? '◎' : '$'}${currentBet.toFixed(isRealMode ? 4 : 2)}`
                  }
                </div>
              </motion.div>
            )}
          </div>

          {/* History */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Game History</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {gameState.gameHistory.length > 0 ? (
                gameState.gameHistory.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${
                      result.win 
                        ? 'border-green-500/30 bg-green-500/10'
                        : 'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">{result.direction}</span>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                          result.win ? result.payout.toFixed(isRealMode ? 4 : 2) : 
                          result.bet.toFixed(isRealMode ? 4 : 2)
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {result.multiplier}x multiplier
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No games yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </GameBackground>
  );
}
