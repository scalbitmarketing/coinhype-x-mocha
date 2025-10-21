import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Trophy, RotateCcw } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';

interface GameResult {
  win: boolean;
  amount: number;
  multiplier?: number;
  details?: string;
}

interface GameResultPanelProps {
  result: GameResult | null;
  gameHistory: GameResult[];
  onNewGame?: () => void;
  className?: string;
}

export default function GameResultPanel({ 
  result, 
  gameHistory, 
  onNewGame,
  className = "" 
}: GameResultPanelProps) {
  const { user } = useAuth();
  const { balance: solanaBalance } = useSolana();
  const isRealMode = user && solanaBalance;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Last Result */}
      {result && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-6 text-center relative overflow-hidden"
        >
          {/* Result Glow Effect */}
          <div className={`absolute inset-0 ${
            result.win 
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/5' 
              : 'bg-gradient-to-br from-red-500/10 to-rose-500/5'
          }`}></div>
          
          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="mb-4"
            >
              {result.win ? (
                <Trophy className="w-12 h-12 text-green-400 mx-auto" 
                       style={{ filter: 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.6))' }} />
              ) : (
                <RotateCcw className="w-12 h-12 text-red-400 mx-auto" />
              )}
            </motion.div>

            <div className={`text-2xl font-bold mb-2 ${
              result.win ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.win ? 'WIN!' : 'Better Luck Next Time'}
            </div>

            {result.multiplier && (
              <div className="text-lg text-gray-300 mb-2">
                {result.multiplier.toFixed(2)}x Multiplier
              </div>
            )}

            {result.details && (
              <div className="text-sm text-gray-400 mb-3">
                {result.details}
              </div>
            )}

            <div className={`text-xl font-bold ${
              result.win ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.win ? '+' : '-'}{isRealMode ? '◎' : '$'}
              {result.amount.toFixed(isRealMode ? 4 : 2)}
            </div>

            {onNewGame && (
              <motion.button
                onClick={onNewGame}
                className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Play Again
              </motion.button>
            )}
          </div>
        </motion.div>
      )}

      {/* Game History */}
      <div className="glass-panel p-4 sm:p-6">
        <h3 className="text-lg font-bold text-white mb-4">Recent Games</h3>
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {gameHistory.length > 0 ? (
            gameHistory.map((game, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border ${
                  game.win 
                    ? 'border-green-500/30 bg-green-500/10'
                    : 'border-red-500/30 bg-red-500/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {game.win ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    {game.details && (
                      <span className="text-sm text-gray-300">{game.details}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {game.multiplier && (
                      <div className="text-xs text-gray-400">
                        {game.multiplier.toFixed(2)}x
                      </div>
                    )}
                    <span className={`text-sm font-bold ${
                      game.win ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {game.win ? '+' : '-'}{isRealMode ? '◎' : '$'}
                      {game.amount.toFixed(isRealMode ? 4 : 2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No games played yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
