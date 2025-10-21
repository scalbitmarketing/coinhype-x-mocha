import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import BetControls from '@/react-app/components/BetControls';
import Logo from '@/react-app/components/Logo';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import SoundManager from '@/react-app/utils/sounds';

interface ScratchCell {
  id: number;
  symbol: string;
  multiplier: number;
  isScratched: boolean;
}

interface ScratchOffGameState {
  isScratching: boolean;
  hasStarted: boolean;
  isGameComplete: boolean;
  cells: ScratchCell[];
  matches: number[];
  lastResult: {
    symbol: string;
    matches: number;
    multiplier: number;
    win: boolean;
    payout: number;
  } | null;
  gameHistory: Array<{
    symbol: string;
    matches: number;
    multiplier: number;
    win: boolean;
    payout: number;
    bet: number;
  }>;
}

export default function ScratchOffGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [gameState, setGameState] = useState<ScratchOffGameState>({
    isScratching: false,
    hasStarted: false,
    isGameComplete: false,
    cells: [],
    matches: [],
    lastResult: null,
    gameHistory: []
  });
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const symbols = ['💎', '🍒', '🔔', '⭐', '👑', '🍀', '🎯', '💰'];
  const multipliers = [2, 3, 5, 10, 25, 50, 100, 500];

  const generateTicket = () => {
    if (currentBet > currentBalance) return;

    const newCells: ScratchCell[] = [];
    
    // Generate 9 cells with random symbols
    for (let i = 0; i < 9; i++) {
      const symbolIndex = Math.floor(Math.random() * symbols.length);
      newCells.push({
        id: i,
        symbol: symbols[symbolIndex],
        multiplier: multipliers[symbolIndex],
        isScratched: false
      });
    }

    // FIXED: Balanced win probability - sometimes guarantee a match
    if (Math.random() < 0.3) { // 30% chance to guarantee at least 3 matches
      const winningSymbol = symbols[Math.floor(Math.random() * symbols.length)];
      const winningMultiplier = multipliers[symbols.indexOf(winningSymbol)];
      
      // Place 3 winning symbols randomly
      const positions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        const position = positions.splice(randomIndex, 1)[0];
        newCells[position].symbol = winningSymbol;
        newCells[position].multiplier = winningMultiplier;
      }
    }

    setGameState(prev => ({
      ...prev,
      cells: newCells,
      hasStarted: true,
      isGameComplete: false,
      matches: [],
      lastResult: null
    }));

    // Always deduct bet immediately for demo mode
    placeBet(currentBet);

    playSound('click');
  };

  const scratchCell = (cellId: number) => {
    if (gameState.isGameComplete || gameState.isScratching) return;

    setGameState(prev => ({
      ...prev,
      cells: prev.cells.map(cell => 
        cell.id === cellId ? { ...cell, isScratched: true } : cell
      )
    }));

    playSound('click');

    // Check if all cells are scratched
    const updatedCells = gameState.cells.map(cell => 
      cell.id === cellId ? { ...cell, isScratched: true } : cell
    );

    const allScratched = updatedCells.every(cell => cell.isScratched);
    if (allScratched) {
      checkForWins(updatedCells);
    }
  };

  const scratchAll = () => {
    if (gameState.isGameComplete || gameState.isScratching) return;

    setGameState(prev => ({
      ...prev,
      isScratching: true
    }));

    // Scratch all cells with animation delay
    gameState.cells.forEach((cell, index) => {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          cells: prev.cells.map(c => 
            c.id === cell.id ? { ...c, isScratched: true } : c
          )
        }));

        // Check for wins after all are scratched
        if (index === gameState.cells.length - 1) {
          setTimeout(() => {
            const allScratched = gameState.cells.map(c => ({ ...c, isScratched: true }));
            checkForWins(allScratched);
            setGameState(prev => ({ ...prev, isScratching: false }));
          }, 200);
        }
      }, index * 100);
    });
  };

  const checkForWins = async (cells: ScratchCell[]) => {
    // Count occurrences of each symbol
    const symbolCounts: { [key: string]: { count: number; multiplier: number } } = {};
    
    cells.forEach(cell => {
      if (symbolCounts[cell.symbol]) {
        symbolCounts[cell.symbol].count++;
      } else {
        symbolCounts[cell.symbol] = { count: 1, multiplier: cell.multiplier };
      }
    });

    // Find the best winning combination
    let bestWin = { symbol: '', matches: 0, multiplier: 0, payout: 0 };
    
    Object.entries(symbolCounts).forEach(([symbol, data]) => {
      if (data.count >= 3) { // Need at least 3 matches to win
        const basePayout = currentBet * data.multiplier;
        const matchBonus = data.count > 3 ? Math.pow(2, data.count - 3) : 1; // Bonus for more matches
        const totalPayout = basePayout * matchBonus;
        
        if (totalPayout > bestWin.payout) {
          bestWin = {
            symbol,
            matches: data.count,
            multiplier: data.multiplier,
            payout: totalPayout
          };
        }
      }
    });

    const win = bestWin.payout > 0;
    const result = {
      symbol: bestWin.symbol || 'None',
      matches: bestWin.matches,
      multiplier: bestWin.multiplier,
      win,
      payout: bestWin.payout
    };

    setGameState(prev => ({
      ...prev,
      lastResult: result,
      gameHistory: [{ ...result, bet: currentBet }, ...prev.gameHistory.slice(0, 9)],
      isGameComplete: true
    }));

    if (win) {
      playSound('win');
      if (!isRealMode) {
        addWin(bestWin.payout);
      }
    }

    if (isRealMode) {
      try {
        await fetch('/api/games/scratchoff/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            betAmountSol: currentBet,
            cells: cells,
            winningSymbol: bestWin.symbol,
            matches: bestWin.matches,
          }),
        });
        await refreshBalance();
      } catch (error) {
        console.error('Scratch off game error:', error);
      }
    }
  };

  const newGame = () => {
    setGameState({
      isScratching: false,
      hasStarted: false,
      isGameComplete: false,
      cells: [],
      matches: [],
      lastResult: gameState.lastResult,
      gameHistory: gameState.gameHistory
    });
  };

  return (
    <GameBackground theme="slots">
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
              <BetControls disabled={gameState.hasStarted && !gameState.isGameComplete} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">How to Play</h3>
              <div className="text-sm text-gray-300 space-y-2">
                <p>• Scratch 9 cells to reveal symbols</p>
                <p>• Match 3+ identical symbols to win</p>
                <p>• More matches = bigger bonus multiplier</p>
                <p>• Higher value symbols = bigger payouts</p>
              </div>
            </div>

            {!gameState.hasStarted && (
              <motion.button
                onClick={generateTicket}
                disabled={currentBet > currentBalance}
                className={`w-full p-4 text-lg font-bold rounded-lg transition-all ${
                  currentBet > currentBalance
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'neon-button'
                }`}
                whileHover={currentBet <= currentBalance ? { scale: 1.02 } : {}}
                whileTap={currentBet <= currentBalance ? { scale: 0.98 } : {}}
              >
                Buy Ticket
              </motion.button>
            )}

            {gameState.hasStarted && !gameState.isGameComplete && (
              <motion.button
                onClick={scratchAll}
                disabled={gameState.isScratching}
                className="w-full p-4 text-lg font-bold rounded-lg neon-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {gameState.isScratching ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Sparkles className="w-5 h-5 animate-spin" />
                    <span>Scratching...</span>
                  </div>
                ) : (
                  'Scratch All'
                )}
              </motion.button>
            )}

            {gameState.isGameComplete && (
              <motion.button
                onClick={newGame}
                className="w-full p-4 text-lg font-bold rounded-lg neon-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                New Ticket
              </motion.button>
            )}
          </div>

          {/* Game Display */}
          <div className="glass-panel p-8">
            {!gameState.hasStarted ? (
              <div className="flex flex-col items-center justify-center h-96">
                <div className="text-6xl mb-4">🎫</div>
                <h3 className="text-xl font-bold text-white mb-2">Buy a Scratch Off Ticket</h3>
                <p className="text-gray-400 text-center">
                  Scratch to reveal symbols and win big prizes!
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-white mb-4 text-center">
                  Scratch Off Ticket
                </h3>
                
                {/* Scratch Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {gameState.cells.map((cell) => (
                    <motion.button
                      key={cell.id}
                      onClick={() => scratchCell(cell.id)}
                      disabled={cell.isScratched || gameState.isGameComplete || gameState.isScratching}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all ${
                        cell.isScratched 
                          ? 'border-gray-600 bg-gray-800/50'
                          : 'border-gray-500 bg-gray-700 hover:bg-gray-600 cursor-pointer'
                      }`}
                      whileHover={!cell.isScratched ? { scale: 1.05 } : {}}
                      whileTap={!cell.isScratched ? { scale: 0.95 } : {}}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: cell.id * 0.1 }}
                    >
                      {cell.isScratched ? cell.symbol : '❓'}
                    </motion.button>
                  ))}
                </div>

                {/* Result */}
                {gameState.lastResult && gameState.isGameComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                  >
                    <div className={`text-2xl font-bold mb-2 ${gameState.lastResult.win ? 'text-green-400' : 'text-red-400'}`}>
                      {gameState.lastResult.win ? 
                        `${gameState.lastResult.matches}x ${gameState.lastResult.symbol}` : 
                        'No Matches'}
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
            )}
          </div>

          {/* History */}
          <div className="glass-panel p-6">
            <h3 className="text-lg font-bold text-white mb-4">Ticket History</h3>
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
                      <div className="flex items-center space-x-2">
                        {result.win ? (
                          <>
                            <span className="text-lg">{result.symbol}</span>
                            <span className="text-sm text-white">x{result.matches}</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400">No Match</span>
                        )}
                      </div>
                      <span className={`text-sm font-bold ${
                        result.win ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                          result.win ? result.payout.toFixed(isRealMode ? 4 : 2) : 
                          result.bet.toFixed(isRealMode ? 4 : 2)
                        }
                      </span>
                    </div>
                    {result.win && (
                      <div className="text-xs text-gray-400">
                        {result.multiplier}x multiplier
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">No tickets yet</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </GameBackground>
  );
}
