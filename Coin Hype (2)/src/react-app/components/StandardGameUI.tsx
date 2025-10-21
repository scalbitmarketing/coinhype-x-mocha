import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Volume2, VolumeX } from 'lucide-react';
import BetControls from '@/react-app/components/BetControls';
import { useGameStore } from '@/react-app/stores/gameStore';

interface StandardGameUIProps {
  gameTitle: string;
  gameRules: string[];
  gameStats?: { label: string; value: string; color?: string }[];
  children: React.ReactNode;
  actionButton: {
    text: string;
    onClick: () => void;
    disabled: boolean;
    loading?: boolean;
  };
  disabled?: boolean;
  className?: string;
  helpContent?: React.ReactNode;
}

export default function StandardGameUI({
  gameTitle,
  gameRules,
  gameStats,
  children,
  actionButton,
  disabled = false,
  helpContent
}: StandardGameUIProps) {
  const [showHelp, setShowHelp] = useState(false);
  const { soundEnabled, toggleSound } = useGameStore();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Section: Balance + Help - 10% height */}
      <div className="h-[10vh] flex items-center justify-between p-4 glass-panel border-b border-white/10">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-white">{gameTitle}</h1>
          {gameStats && (
            <div className="flex items-center space-x-4">
              {gameStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs text-gray-400">{stat.label}</p>
                  <p className={`text-sm font-bold ${stat.color || 'text-white'}`}>
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title={soundEnabled ? 'Mute Sounds' : 'Enable Sounds'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </button>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Game Rules"
            >
              <HelpCircle className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Help Panel - Overlay */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">How to Play {gameTitle}</h3>
                <button
                  onClick={() => setShowHelp(false)}
                  className="p-1 rounded hover:bg-white/10"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              
              {helpContent ? (
                helpContent
              ) : (
                <ul className="text-sm text-gray-300 space-y-2">
                  {gameRules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-cyan-400 mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area - 70% height */}
      <div className="flex-1 h-[60vh] p-4">
        <div className="h-full flex items-center justify-center">
          {children}
        </div>
      </div>

      {/* Bottom Section: Bet Controls + Action - 20% height */}
      <div className="h-[30vh] grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        {/* Bet Controls */}
        <div className="glass-panel p-4">
          <BetControls disabled={disabled} />
        </div>

        {/* Action Button */}
        <div className="lg:col-span-2 glass-panel p-4 flex items-center justify-center">
          <motion.button
            onClick={actionButton.onClick}
            disabled={actionButton.disabled}
            className={`w-full max-w-md h-16 text-xl font-bold rounded-lg transition-all ${
              actionButton.disabled 
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'neon-button hover:scale-105'
            }`}
            whileHover={!actionButton.disabled ? { scale: 1.02 } : {}}
            whileTap={!actionButton.disabled ? { scale: 0.98 } : {}}
          >
            {actionButton.loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Playing...</span>
              </div>
            ) : (
              actionButton.text
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
