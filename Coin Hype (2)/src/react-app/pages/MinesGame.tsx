import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Bomb, Gem } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import UniversalGameTemplate from '@/react-app/components/UniversalGameTemplate';
import { GameAnimations } from '@/react-app/utils/gameAnimations';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { generateClientSeed, generateServerSeed } from '@/react-app/utils/simplifiedProvablyFair';
import { generateMinePositions } from '@/react-app/utils/preciseGameLogic';
import { MINES_CONFIG } from '@/react-app/config/gameConfig';

interface Cell {
  id: number;
  isMine: boolean;
  isRevealed: boolean;
  isGem: boolean;
}

interface MinesGameResult {
  gemsFound: number;
  totalMines: number;
  multiplier: number;
  payout: number;
  win: boolean;
  hitMine: boolean;
  hash: string;
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  mines: number[];
}

export default function MinesGame() {
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, setBet, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [mineCount, setMineCount] = useState(3);
  const [gameState, setGameState] = useState<'betting' | 'playing' | 'finished'>('betting');
  const [board, setBoard] = useState<Cell[]>([]);
  const [gemsFound, setGemsFound] = useState(0);
  const [currentMultiplier, setCurrentMultiplier] = useState(1.0);
  const [lastResult, setLastResult] = useState<MinesGameResult | null>(null);
  const [gameHistory, setGameHistory] = useState<MinesGameResult[]>([]);
  const [gameSeeds, setGameSeeds] = useState(() => ({
    serverSeed: generateServerSeed(),
    clientSeed: generateClientSeed(),
    nonce: 0
  }));
  const [minePositions, setMinePositions] = useState<number[]>([]);
  
  const soundManager = useRef(new EnhancedSoundManager());

  const initializeBoard = () => {
    // Generate provably fair mine positions using precise logic
    const minePositions = generateMinePositions(mineCount);
    setMinePositions(minePositions);
    
    const cells: Cell[] = Array.from({ length: 25 }, (_, index) => ({
      id: index,
      isMine: minePositions.includes(index),
      isRevealed: false,
      isGem: !minePositions.includes(index),
    }));

    setBoard(cells);
  };

  const startGame = async () => {
    if (currentBalance < currentBet) return;
    
    setGameState('playing');
    setGemsFound(0);
    setCurrentMultiplier(1.0);
    setLastResult(null);
    initializeBoard();
    soundManager.current.play('click');
    
    // Always deduct bet immediately
    placeBet(currentBet);
  };

  // Use precise game logic for multiplier calculation
  const calculateMultiplier = (gems: number) => {
    return MINES_CONFIG.calculateMultiplier(gems);
  };

  const revealCell = async (cellId: number) => {
    if (gameState !== 'playing') return;
    
    const cell = board[cellId];
    if (cell.isRevealed) return;

    const cellElement = document.getElementById(`mine-cell-${cellId}`);
    const newBoard = [...board];
    newBoard[cellId].isRevealed = true;
    setBoard(newBoard);

    if (cell.isMine) {
      // Hit mine - animate explosion
      if (cellElement) {
        await GameAnimations.animateMineExplosion(cellElement);
      }
      
      soundManager.current.play('explosion');
      setGameState('finished');
      
      // Reveal all mines for dramatic effect
      const finalBoard = newBoard.map(c => 
        c.isMine ? { ...c, isRevealed: true } : c
      );
      setBoard(finalBoard);

      const result: MinesGameResult = {
        gemsFound,
        totalMines: mineCount,
        multiplier: 0,
        payout: 0,
        win: false,
        hitMine: true,
        hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`,
        serverSeed: gameSeeds.serverSeed,
        clientSeed: gameSeeds.clientSeed,
        nonce: gameSeeds.nonce,
        mines: minePositions
      };

      setLastResult(result);
      setGameHistory(prev => [result, ...prev.slice(0, 9)]);
      
      // Increment nonce
      setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

      if (isRealMode) {
        try {
          await fetch('/api/games/mines/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              mineCount,
              gemsFound,
              hitMine: true,
              serverSeed: gameSeeds.serverSeed,
              clientSeed: gameSeeds.clientSeed,
              nonce: gameSeeds.nonce
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('Mines game error:', error);
        }
      }
    } else {
      // Found gem - animate gem reveal
      if (cellElement) {
        await GameAnimations.animateGemReveal(cellElement);
      }
      
      soundManager.current.play('gem');
      const newGemsFound = gemsFound + 1;
      setGemsFound(newGemsFound);
      
      const newMultiplier = calculateMultiplier(newGemsFound);
      setCurrentMultiplier(newMultiplier);

      // Check for auto-win condition (all safe cells revealed)
      const safeCells = 25 - mineCount;
      if (newGemsFound === safeCells) {
        // Player found all gems! Auto cash out with maximum multiplier
        setTimeout(() => {
          cashOut(true); // Pass auto-win flag
        }, 1000);
      }
    }
  };

  const cashOut = async (autoWin: boolean = false) => {
    if (gameState !== 'playing' || gemsFound === 0) return;
    
    setGameState('finished');
    const finalMultiplier = autoWin ? calculateMultiplier(gemsFound) + 0.5 : currentMultiplier; // Bonus for perfect game
    const payout = currentBet * finalMultiplier;
    
    soundManager.current.play('win');

    const result: MinesGameResult = {
      gemsFound,
      totalMines: mineCount,
      multiplier: finalMultiplier,
      payout,
      win: true,
      hitMine: false,
      hash: `${gameSeeds.serverSeed}:${gameSeeds.clientSeed}:${gameSeeds.nonce}`,
      serverSeed: gameSeeds.serverSeed,
      clientSeed: gameSeeds.clientSeed,
      nonce: gameSeeds.nonce,
      mines: minePositions
    };

    setLastResult(result);
    setGameHistory(prev => [result, ...prev.slice(0, 9)]);
    
    // Increment nonce
    setGameSeeds(prev => ({ ...prev, nonce: prev.nonce + 1 }));

    try {
      if (isRealMode) {
        await fetch('/api/games/mines/play', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            betAmountSol: currentBet,
            mineCount,
            gemsFound,
            hitMine: false,
            serverSeed: gameSeeds.serverSeed,
            clientSeed: gameSeeds.clientSeed,
            nonce: gameSeeds.nonce
          }),
        });
        await refreshBalance();
      } else {
        addWin(payout);
      }
    } catch (error) {
      console.error('Mines cashout error:', error);
    }
  };

  const resetGame = () => {
    setGameState('betting');
    setBoard([]);
    setGemsFound(0);
    setCurrentMultiplier(1.0);
    setLastResult(null);
  };

  const getCellContent = (cell: Cell) => {
    if (!cell.isRevealed) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center relative overflow-hidden">
          <div className="text-gray-400 text-lg">?</div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20"></div>
        </div>
      );
    }
    
    if (cell.isMine) {
      return (
        <motion.div 
          className="w-full h-full flex items-center justify-center bg-red-600/20 rounded-lg"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Bomb className="w-6 h-6 text-red-400" style={{
            filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.6)) drop-shadow(0 0 20px rgba(249, 115, 22, 0.4))'
          }} />
        </motion.div>
      );
    }
    
    return (
      <motion.div 
        className="w-full h-full flex items-center justify-center bg-green-600/20 rounded-lg"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Gem className="w-6 h-6 text-green-400" style={{
          filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6)) drop-shadow(0 0 20px rgba(16, 185, 129, 0.4))'
        }} />
      </motion.div>
    );
  };

  const gameStats = [
    { label: 'Mines', value: mineCount.toString(), color: 'text-red-400' },
    { label: 'Gems Found', value: gemsFound.toString(), color: 'text-green-400' },
    { label: 'Multiplier', value: `${currentMultiplier.toFixed(2)}x`, color: 'text-cyan-400' },
    { label: 'Nonce', value: `#${gameSeeds.nonce}`, color: 'text-gray-400' }
  ];

  const getActionButton = () => {
    if (gameState === 'betting') {
      return {
        text: `Start Game - ◎ ${currentBet.toFixed(2)}`,
        onClick: startGame,
        disabled: currentBalance < currentBet,
        loading: false
      };
    }
    
    if (gameState === 'playing' && gemsFound > 0) {
      return {
        text: `Cash Out - ◎ ${(currentBet * currentMultiplier).toFixed(2)}`,
        onClick: () => cashOut(false),
        disabled: false,
        loading: false
      };
    }
    
    if (gameState === 'finished') {
      return {
        text: 'New Game',
        onClick: resetGame,
        disabled: false,
        loading: false
      };
    }
    
    return {
      text: 'Click cells to reveal',
      onClick: () => {},
      disabled: true,
      loading: false
    };
  };

  return (
    <UniversalGameTemplate
      gameName="Mines"
      gameStats={gameStats}
      showBetControls={false}
      backgroundColor="from-red-900/20 via-orange-900/20 to-yellow-900/20"
      actions={[getActionButton()]}
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

          {/* Mine count selection */}
          <div>
            <label className="block text-xs text-white/70 mb-2">Number of Mines</label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 3, 5, 7, 10, 15, 20, 23, 24].map((count) => (
                <button
                  key={count}
                  onClick={() => setMineCount(count)}
                  disabled={gameState === 'playing'}
                  className={`p-2 text-sm rounded-lg border transition-all ${
                    mineCount === count
                      ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                      : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <div className="w-full max-w-md mx-auto space-y-6">
        {/* Game Info */}
        <div className="glass-panel p-4 text-center">
          <div className="text-lg text-gray-300 mb-1">
            Gems Found: <span className="text-green-400 font-bold">{gemsFound}</span> | 
            Mines: <span className="text-red-400 font-bold">{mineCount}</span>
          </div>
          {gameState === 'playing' && gemsFound > 0 && (
            <div className="text-sm text-gray-400">
              {(25 - mineCount) - gemsFound} safe cells remaining
            </div>
          )}
        </div>

        {/* Game Board */}
        <div className="glass-panel p-4">
          <div className="grid grid-cols-5 gap-2 max-w-sm mx-auto">
            {board.map((cell) => (
              <motion.button
                key={cell.id}
                id={`mine-cell-${cell.id}`}
                onClick={() => revealCell(cell.id)}
                disabled={gameState !== 'playing' || cell.isRevealed}
                className={`aspect-square p-2 rounded-lg border transition-all ${
                  cell.isRevealed 
                    ? cell.isMine 
                      ? 'bg-red-500/20 border-red-500/50' 
                      : 'bg-green-500/20 border-green-500/50'
                    : 'bg-gray-700 border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                } disabled:cursor-not-allowed`}
                whileHover={!cell.isRevealed && gameState === 'playing' ? { scale: 1.05 } : {}}
                whileTap={!cell.isRevealed && gameState === 'playing' ? { scale: 0.95 } : {}}
              >
                {getCellContent(cell)}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className="glass-panel p-4 text-center">
            <div className={`text-2xl font-bold mb-2 ${
              lastResult.win ? 'text-green-400' : 'text-red-400'
            }`}>
              {lastResult.hitMine ? 'MINE HIT!' : 'GEMS FOUND!'}
            </div>
            {lastResult.win && (
              <div className="text-lg text-green-400 font-semibold">
                Won: ◎ {lastResult.payout.toFixed(2)}
              </div>
            )}
            <div className="text-sm text-gray-400 mt-2">
              Found {lastResult.gemsFound} gems with {lastResult.totalMines} mines
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="glass-panel p-4">
          <h3 className="text-sm font-bold text-white mb-3">Recent Games</h3>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {gameHistory.slice(0, 5).map((result, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-2 rounded text-sm ${
                  result.win ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                <span>
                  {result.gemsFound} gems, {result.totalMines} mines
                </span>
                <span>
                  {result.win ? '+' : '-'}◎ {result.win ? result.payout.toFixed(2) : currentBet.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UniversalGameTemplate>
  );
}
