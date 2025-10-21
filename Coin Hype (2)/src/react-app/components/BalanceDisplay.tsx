import { motion } from 'framer-motion';
import { Coins, Volume2, VolumeX, Wallet } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';
import { useState } from 'react';
import EnhancedWalletModal from './EnhancedWalletModal';

const soundManager = new EnhancedSoundManager();

export default function BalanceDisplay() {
  const { user } = useAuth();
  const { connected } = useWallet();
  const { balance: solanaBalance } = useSolana();
  const { balance: demoBalance, soundEnabled, toggleSound } = useGameStore();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Use Solana balance if user is logged in and wallet connected, otherwise demo balance
  const displayBalance = user && solanaBalance && connected ? solanaBalance.balanceSol : demoBalance;
  const isRealMode = user && solanaBalance && connected;

  const handleBalanceClick = async () => {
    if (soundEnabled) {
      await soundManager.play('cashout');
    }
    setIsWalletModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between glass-panel min-w-0 relative">
        {/* Entire balance area is now clickable */}
        <motion.button 
          className="flex items-center space-x-1 sm:space-x-2 min-w-0 p-1 sm:p-2 flex-1 rounded-lg bg-transparent hover:bg-white/5 transition-all duration-300 group relative overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleBalanceClick}
        >
          {/* Animated background glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-purple-500/0 to-pink-500/0 group-hover:from-cyan-500/20 group-hover:via-purple-500/20 group-hover:to-pink-500/20 rounded-lg transition-all duration-300"></div>
          
          {/* Sparkle effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute top-1 left-2 w-1 h-1 bg-cyan-400 rounded-full animate-pulse"></div>
            <div className="absolute top-3 right-4 w-0.5 h-0.5 bg-pink-400 rounded-full animate-pulse delay-300"></div>
            <div className="absolute bottom-2 left-1/2 w-0.5 h-0.5 bg-purple-400 rounded-full animate-pulse delay-700"></div>
          </div>
          
          <div className="p-1 sm:p-1.5 rounded-lg bg-gray-700/50 border border-gray-600/50 group-hover:bg-gray-600/50 transition-colors relative group-hover:shadow-lg group-hover:shadow-cyan-500/20 z-10">
            {isRealMode ? (
              <Wallet className="w-3 h-3 text-gray-300 group-hover:text-cyan-300 transition-colors" />
            ) : (
              <Coins className="w-3 h-3 text-gray-300 group-hover:text-cyan-300 transition-colors" />
            )}
          </div>
          
          <div className="min-w-0 z-10">
            <motion.p 
              className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-cyan-100 transition-colors"
              key={displayBalance}
              initial={{ scale: 1.1, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {isRealMode ? `◎${displayBalance.toFixed(4)}` : `$${displayBalance.toFixed(2)}`}
            </motion.p>
            <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
              Tap to manage
            </p>
          </div>
          
          {/* Ripple effect on click */}
          <motion.div
            className="absolute inset-0 bg-cyan-400/30 rounded-lg opacity-0"
            animate={{ scale: [1, 1.2], opacity: [0.3, 0] }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            key={`ripple-${Date.now()}`}
          />
        </motion.button>
        
        <motion.button
          onClick={toggleSound}
          className="p-1 sm:p-1.5 rounded-lg hover:bg-white/10 transition-all duration-300"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {soundEnabled ? (
            <Volume2 className="w-3 h-3 text-gray-400" />
          ) : (
            <VolumeX className="w-3 h-3 text-gray-500" />
          )}
        </motion.button>
      </div>

      {/* Enhanced Wallet Modal */}
      <EnhancedWalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </>
  );
}
