import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import BetControls from '@/react-app/components/BetControls';
import GameBackground from '@/react-app/components/GameBackground';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import SoundManager from '@/react-app/utils/sounds';

interface RpsGameState {
  isPlaying: boolean;
  playerChoice: 'rock' | 'paper' | 'scissors' | null;
  computerChoice: 'rock' | 'paper' | 'scissors' | null;
  lastResult: {
    player: string;
    computer: string;
    outcome: 'win' | 'lose' | 'tie';
    payout: number;
  } | null;
  gameHistory: Array<{
    player: string;
    computer: string;
    outcome: 'win' | 'lose' | 'tie';
    payout: number;
    bet: number;
  }>;
}

export default function RockPaperScissorsGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance, refreshBalance } = useSolana();
  const { balance: demoBalance, currentBet, soundEnabled, setPlaying, placeBet, addWin } = useGameStore();
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;
  
  const [gameState, setGameState] = useState<RpsGameState>({
    isPlaying: false,
    playerChoice: null,
    computerChoice: null,
    lastResult: null,
    gameHistory: []
  });
  
  const soundManager = useRef(new SoundManager());

  const playSound = (type: 'click' | 'win') => {
    if (soundEnabled) {
      soundManager.current.play(type);
    }
  };

  const choices = [
    { id: 'rock' as const, label: 'Rock', emoji: '🪨', beats: 'scissors' as const },
    { id: 'paper' as const, label: 'Paper', emoji: '📄', beats: 'rock' as const },
    { id: 'scissors' as const, label: 'Scissors', emoji: '✂️', beats: 'paper' as const }
  ];

  const selectChoice = (choice: 'rock' | 'paper' | 'scissors') => {
    if (gameState.isPlaying) return;
    setGameState(prev => ({ ...prev, playerChoice: choice }));
    playSound('click');
  };

  const play = async () => {
    if (gameState.isPlaying || !gameState.playerChoice || currentBet > currentBalance) return;
    
    setGameState(prev => ({ ...prev, isPlaying: true }));
    setPlaying(true);
    playSound('click');
    
    if (!isRealMode) {
      placeBet(currentBet);
    }

    // FIXED: Generate truly random computer choice
    const computerChoiceId = choices[Math.floor(Math.random() * choices.length)].id;
    
    setTimeout(async () => {
      setGameState(prev => ({ ...prev, computerChoice: computerChoiceId }));
      
      const playerChoiceObj = choices.find(c => c.id === gameState.playerChoice)!;
      const computerChoiceObj = choices.find(c => c.id === computerChoiceId)!;
      
      let outcome: 'win' | 'lose' | 'tie';
      let payout = 0;
      
      if (gameState.playerChoice === computerChoiceId) {
        outcome = 'tie';
        payout = currentBet; // FIXED: Return bet only on tie (no profit)
      } else if (playerChoiceObj.beats === computerChoiceId) {
        outcome = 'win';
        payout = currentBet * 1.96; // FIXED: Fair 1.96x payout (2% house edge)
      } else {
        outcome = 'lose';
        payout = 0;
      }
      
      const result = {
        player: playerChoiceObj.label,
        computer: computerChoiceObj.label,
        outcome,
        payout
      };

      setGameState(prev => ({
        ...prev,
        lastResult: result,
        gameHistory: [{ ...result, bet: currentBet }, ...prev.gameHistory.slice(0, 9)],
        isPlaying: false,
        playerChoice: null,
        computerChoice: null
      }));

      if (outcome === 'win') {
        playSound('win');
        if (!isRealMode) {
          addWin(payout);
        }
      } else if (outcome === 'tie' && !isRealMode) {
        addWin(payout); // Add back the bet amount
      }

      if (isRealMode) {
        try {
          await fetch('/api/games/rps/play', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              betAmountSol: currentBet,
              playerChoice: gameState.playerChoice,
              computerChoice: computerChoiceId,
            }),
          });
          await refreshBalance();
        } catch (error) {
          console.error('RPS game error:', error);
        }
      }

      setPlaying(false);
    }, 1500);
  };

  return (
    <GameBackground theme="rps">
      {/* Header */}
      <header className="px-6 py-4 border-b border-white/10 bg-gray-900/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0 z-[60]"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
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
              <BetControls disabled={gameState.isPlaying} />
            </div>

            <div className="glass-panel p-6">
              <h3 className="text-lg font-bold text-white mb-4">Choose Your Move</h3>
              <div className="grid grid-cols-1 gap-3">
                {choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => selectChoice(choice.id)}
                    disabled={gameState.isPlaying}
                    className={`p-4 rounded-lg border-2 transition-all font-bold ${
                      gameState.playerChoice === choice.id
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                        : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{choice.emoji}</span>
                      <div className="text-left">
                        <div>{choice.label}</div>
                        <div className="text-xs text-gray-400">Beats {choice.beats}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <motion.button
              onClick={play}
              disabled={!gameState.playerChoice || currentBet > currentBalance || gameState.isPlaying}
              className={`w-full p-4 text-lg font-bold rounded-lg transition-all ${
                !gameState.playerChoice || currentBet > currentBalance
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'neon-button'
              }`}
              whileHover={gameState.playerChoice && currentBet <= currentBalance && !gameState.isPlaying ? { scale: 1.02 } : {}}
              whileTap={gameState.playerChoice && currentBet <= currentBalance && !gameState.isPlaying ? { scale: 0.98 } : {}}
            >
              {gameState.isPlaying ? (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-5 h-5 animate-pulse" />
                  <span>Playing...</span>
                </div>
              ) : (
                'Play Game'
              )}
            </motion.button>
          </div>

          {/* Game Display */}
          <div className="glass-panel p-8 flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-8 mb-8">
              {/* Player */}
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">You</div>
                <motion.div
                  className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl border-4 border-cyan-400"
                  animate={{
                    scale: gameState.isPlaying ? [1, 1.1, 1] : 1
                  }}
                  transition={{ duration: 0.5, repeat: gameState.isPlaying ? Infinity : 0 }}
                >
                  {gameState.playerChoice ? choices.find(c => c.id === gameState.playerChoice)?.emoji : '❓'}
                </motion.div>
              </div>

              {/* VS */}
              <div className="text-2xl font-bold text-white">VS</div>

              {/* Computer */}
              <div className="text-center">
                <div className="text-sm text-gray-400 mb-2">Computer</div>
                <motion.div
                  className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl border-4 border-red-400"
                  animate={{
                    scale: gameState.isPlaying ? [1, 1.1, 1] : 1,
                    rotate: gameState.isPlaying ? [0, 180, 360] : 0
                  }}
                  transition={{ duration: 0.5, repeat: gameState.isPlaying ? Infinity : 0 }}
                >
                  {gameState.computerChoice ? choices.find(c => c.id === gameState.computerChoice)?.emoji : '🤖'}
                </motion.div>
              </div>
            </div>

            {gameState.lastResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className={`text-2xl font-bold mb-2 ${
                  gameState.lastResult.outcome === 'win' ? 'text-green-400' : 
                  gameState.lastResult.outcome === 'tie' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {gameState.lastResult.outcome === 'win' ? 'You Win!' : 
                   gameState.lastResult.outcome === 'tie' ? 'Tie Game!' : 'You Lose!'}
                </div>
                <div className="text-sm text-gray-400 mb-2">
                  {gameState.lastResult.player} vs {gameState.lastResult.computer}
                </div>
                <div className={`text-xl font-bold ${
                  gameState.lastResult.outcome === 'win' ? 'text-green-400' : 
                  gameState.lastResult.outcome === 'tie' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {gameState.lastResult.outcome === 'win' ? '+' : 
                   gameState.lastResult.outcome === 'tie' ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                    gameState.lastResult.outcome === 'tie' ? 
                    gameState.lastResult.payout.toFixed(isRealMode ? 4 : 2) :
                    gameState.lastResult.outcome === 'win' ? 
                    gameState.lastResult.payout.toFixed(isRealMode ? 4 : 2) : 
                    currentBet.toFixed(isRealMode ? 4 : 2)
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
                      result.outcome === 'win' ? 'border-green-500/30 bg-green-500/10' :
                      result.outcome === 'tie' ? 'border-yellow-500/30 bg-yellow-500/10' :
                      'border-red-500/30 bg-red-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-sm text-white">
                        {result.player} vs {result.computer}
                      </div>
                      <span className={`text-sm font-bold ${
                        result.outcome === 'win' ? 'text-green-400' : 
                        result.outcome === 'tie' ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {result.outcome === 'win' ? '+' : 
                         result.outcome === 'tie' ? '+' : '-'}{isRealMode ? '◎' : '$'}{
                          result.outcome === 'tie' ? 
                          result.payout.toFixed(isRealMode ? 4 : 2) :
                          result.outcome === 'win' ? 
                          result.payout.toFixed(isRealMode ? 4 : 2) : 
                          result.bet.toFixed(isRealMode ? 4 : 2)
                        }
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 capitalize">
                      {result.outcome}
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
