import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  ExternalLink,
  Zap,
  Shield,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import DepositModal from './DepositModal';
import WithdrawModal from './WithdrawModal';

interface EnhancedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedWalletModal({ isOpen, onClose }: EnhancedWalletModalProps) {
  const { user } = useAuth();
  const { publicKey, connected, disconnect } = useWallet();
  const { balance, refreshBalance, isLoading } = useSolana();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isRealMode = user && balance && connected;
  const displayBalance = isRealMode ? balance.balanceSol : 0;

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toBase58());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshBalance();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { type: "spring" as const, damping: 25, stiffness: 300 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: 20,
      transition: { duration: 0.2 }
    }
  };

  const balanceVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: { delay: 0.2, type: "spring" as const, damping: 20 }
    }
  };

  const buttonVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i: number) => ({
      x: 0,
      opacity: 1,
      transition: { delay: 0.3 + i * 0.1, type: "spring" as const, damping: 25 }
    })
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative w-full max-w-md"
            >
              {/* Background with glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 rounded-xl blur-xl"></div>
              
              {/* Main modal */}
              <div className="relative glass-panel p-6 rounded-xl border border-white/20">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <motion.div 
                    className="flex items-center space-x-3"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500">
                      <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Wallet</h2>
                  </motion.div>
                  
                  <motion.button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </motion.button>
                </div>

                {/* Connection Status */}
                {!connected ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
                        <Wallet className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Connect Your Wallet</h3>
                      <p className="text-gray-400 text-sm mb-6">Connect a Solana wallet to start playing with real crypto</p>
                      
                      <WalletMultiButton className="!bg-gradient-to-r !from-cyan-600 !to-purple-600 !border-0 !rounded-lg !font-semibold hover:!from-cyan-700 hover:!to-purple-700 !transition-all !text-sm !py-3 !px-6" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {/* Balance Display with Micro Interaction */}
                    <motion.div 
                      variants={balanceVariants}
                      initial="hidden"
                      animate="visible"
                      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6 border border-white/10"
                    >
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-400 text-sm">Total Balance</span>
                          <motion.button
                            onClick={handleRefresh}
                            disabled={refreshing || isLoading}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
                          </motion.button>
                        </div>
                        
                        <motion.div
                          key={displayBalance}
                          initial={{ scale: 1.05, opacity: 0.8 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", damping: 20 }}
                          className="text-3xl font-bold text-white mb-1"
                        >
                          ◎{displayBalance.toFixed(4)}
                        </motion.div>
                        
                        <div className="text-sm text-gray-400">
                          ≈ ${(displayBalance * 150).toFixed(2)} USD
                        </div>
                      </div>
                    </motion.div>

                    {/* Wallet Address */}
                    <motion.div 
                      className="bg-gray-800/30 rounded-lg p-4"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-gray-400 mb-1">Wallet Address</div>
                          <div className="text-sm font-mono text-white truncate">
                            {publicKey?.toBase58()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 ml-3">
                          <motion.button
                            onClick={copyAddress}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-gray-400'}`} />
                          </motion.button>
                          <motion.a
                            href={`https://solscan.io/account/${publicKey?.toBase58()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ExternalLink className="w-4 h-4 text-gray-400" />
                          </motion.a>
                        </div>
                      </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        custom={0}
                        variants={buttonVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setShowDepositModal(true)}
                        className="group flex items-center justify-center space-x-2 p-4 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ArrowDownLeft className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
                        <span className="font-semibold text-white">Deposit</span>
                      </motion.button>

                      <motion.button
                        custom={1}
                        variants={buttonVariants}
                        initial="hidden"
                        animate="visible"
                        onClick={() => setShowWithdrawModal(true)}
                        disabled={displayBalance <= 0.001}
                        className="group flex items-center justify-center space-x-2 p-4 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={displayBalance > 0.001 ? { scale: 1.02 } : {}}
                        whileTap={displayBalance > 0.001 ? { scale: 0.98 } : {}}
                      >
                        <ArrowUpRight className="w-4 h-4 text-white group-hover:-rotate-12 transition-transform" />
                        <span className="font-semibold text-white">Withdraw</span>
                      </motion.button>
                    </div>

                    {/* Stats */}
                    <motion.div 
                      className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-blue-500/20">
                          <Zap className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-xs text-gray-400">Instant</div>
                        <div className="text-sm font-semibold text-white">Deposits</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-green-500/20">
                          <Shield className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-xs text-gray-400">Secure</div>
                        <div className="text-sm font-semibold text-white">Wallet</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center justify-center w-8 h-8 mx-auto mb-2 rounded-full bg-purple-500/20">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                        </div>
                        <div className="text-xs text-gray-400">Fast</div>
                        <div className="text-sm font-semibold text-white">Payouts</div>
                      </div>
                    </motion.div>

                    {/* Disconnect Button */}
                    <motion.button
                      onClick={disconnect}
                      className="w-full p-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Disconnect Wallet
                    </motion.button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      
      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} />
      )}
    </>
  );
}
