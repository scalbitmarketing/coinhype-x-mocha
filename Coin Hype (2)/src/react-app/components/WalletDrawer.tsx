import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { 
  Wallet, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Copy,
  X,
  Plus,
  Minus,
  ChevronDown,
  Zap
} from 'lucide-react';
import WithdrawModal from '@/react-app/components/WithdrawModal';
import DepositModal from '@/react-app/components/DepositModal';

interface WalletDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletDrawer({ isOpen, onClose }: WalletDrawerProps) {
  const { user, redirectToLogin } = useAuth();
  const { publicKey, connected } = useWallet();
  const { connectWallet, isLoading, balance } = useSolana();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleConnectToBackend = async () => {
    if (!publicKey || !user) return;
    
    setIsConnecting(true);
    setConnectionStatus('idle');

    try {
      await connectWallet(publicKey.toBase58());
      setConnectionStatus('success');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to connect wallet to backend:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const copyHouseAddress = async () => {
    try {
      await navigator.clipboard.writeText('3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7');
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const drawerVariants = {
    hidden: { 
      y: '100%',
      opacity: 0
    },
    visible: { 
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      y: '100%',
      opacity: 0,
      transition: {
        duration: 0.2
      }
    }
  };

  if (!user) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
              onClick={onClose}
            />
            
            {/* Drawer */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-0 left-0 right-0 z-[61] max-h-[80vh] overflow-y-auto"
            >
              <div className="glass-panel rounded-t-2xl border-b-0 p-6 mx-4 mb-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Connect Wallet</h2>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="text-center space-y-6">
                  <div className="p-4 rounded-full bg-gray-700/30 border border-gray-600/50 w-16 h-16 flex items-center justify-center mx-auto">
                    <Wallet className="w-8 h-8 text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Login Required</h3>
                    <p className="text-gray-400 text-sm mb-6">Connect your wallet to start playing with real crypto.</p>
                  </div>
                  <button
                    onClick={redirectToLogin}
                    className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-purple-700 transition-colors"
                  >
                    Login with Google
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed bottom-0 left-0 right-0 z-[61] max-h-[80vh] overflow-y-auto"
          >
            <div className="glass-panel rounded-t-2xl border-b-0 p-6 mx-4 mb-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Crypto Wallet</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Balance Display */}
                <div className="glass-panel p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      {balance ? `${balance.balanceSol.toFixed(4)} SOL` : '0.0000 SOL'}
                    </div>
                    <p className="text-gray-400 text-sm">
                      ≈ ${balance ? (balance.balanceSol * 25).toFixed(2) : '0.00'} USD
                    </p>
                  </div>
                </div>

                {!connected ? (
                  <div className="text-center space-y-4">
                    <div className="p-3 rounded-full bg-gray-700/30 border border-gray-600/50 w-12 h-12 flex items-center justify-center mx-auto">
                      <Wallet className="w-6 h-6 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Connect Your Wallet</h3>
                    <p className="text-gray-400 text-sm">Choose a wallet to start playing with real SOL</p>
                    <div className="flex justify-center">
                      <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-cyan-600 !border-0 !rounded-lg !font-semibold hover:!from-purple-700 hover:!to-cyan-700 !transition-all !text-sm !py-3 !px-6" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Connected Wallet Info */}
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-green-400 font-medium">Wallet Connected</span>
                      </div>
                      <p className="text-xs text-gray-400 font-mono">
                        {publicKey?.toBase58().slice(0, 16)}...
                      </p>
                    </div>

                    {/* Backend Connection */}
                    {connected && publicKey && (
                      <div className="space-y-3">
                        <button
                          onClick={handleConnectToBackend}
                          disabled={isConnecting || isLoading}
                          className={`w-full py-3 rounded-lg font-semibold transition-all text-sm ${
                            connectionStatus === 'success'
                              ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-not-allowed'
                              : connectionStatus === 'error'
                              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
                              : 'bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-700 hover:to-purple-700'
                          }`}
                        >
                          {isConnecting ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                              <span>Connecting...</span>
                            </div>
                          ) : connectionStatus === 'success' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <CheckCircle className="w-4 h-4" />
                              <span>Connected to Casino</span>
                            </div>
                          ) : connectionStatus === 'error' ? (
                            <div className="flex items-center justify-center space-x-2">
                              <AlertCircle className="w-4 h-4" />
                              <span>Retry Connection</span>
                            </div>
                          ) : (
                            'Connect to Casino'
                          )}
                        </button>

                        {connectionStatus === 'success' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-3"
                          >
                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setShowDepositModal(true)}
                                className="flex items-center justify-center space-x-2 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-semibold transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Deposit</span>
                              </button>
                              
                              {balance && balance.balanceSol > 0.001 && (
                                <button
                                  onClick={() => setShowWithdrawModal(true)}
                                  className="flex items-center justify-center space-x-2 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                  <span>Withdraw</span>
                                </button>
                              )}
                            </div>

                            {/* House Wallet Info */}
                            <div className="glass-panel p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h4 className="text-sm font-medium text-white mb-1">House Wallet</h4>
                                  <p className="text-xs text-gray-400 font-mono">
                                    3cpyvHd8Y...i3Gt7
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={copyHouseAddress}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                  >
                                    <Copy className={`w-4 h-4 ${copiedAddress ? 'text-green-400' : ''}`} />
                                  </button>
                                  <a
                                    href="https://solscan.io/account/3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="glass-panel p-4">
                              <h4 className="text-sm font-medium text-white mb-3">Quick Actions</h4>
                              <div className="space-y-2">
                                <button
                                  onClick={() => setShowDepositModal(true)}
                                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 text-left transition-colors"
                                >
                                  <div className="flex items-center space-x-3">
                                    <Plus className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-white">Instant Deposit</span>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                                </button>
                                
                                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 text-left transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <Zap className="w-4 h-4 text-yellow-400" />
                                    <span className="text-sm text-white">Lightning Fast Games</span>
                                  </div>
                                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Modals */}
          {showWithdrawModal && (
            <WithdrawModal onClose={() => setShowWithdrawModal(false)} />
          )}
          {showDepositModal && (
            <DepositModal onClose={() => setShowDepositModal(false)} />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
