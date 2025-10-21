import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { Wallet, ExternalLink, CheckCircle, AlertCircle, ArrowUpRight, LogIn, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import WithdrawModal from '@/react-app/components/WithdrawModal';

export default function WalletConnection() {
  const { user } = useAuth();
  const { publicKey, connected } = useWallet();
  const { connectWallet, isLoading, balance } = useSolana();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const navigate = useNavigate();

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

  // Show login button when user is not authenticated
  if (!user) {
    return (
      <div className="space-y-3">
        <motion.button
          onClick={() => navigate('/create-account')}
          className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <LogIn className="w-5 h-5" />
          <span>Login / Sign Up</span>
        </motion.button>
        
        <div className="glass-panel p-4">
          <div className="text-center space-y-3">
            <div className="p-3 rounded-full bg-gray-700/30 border border-gray-600/50 w-12 h-12 flex items-center justify-center mx-auto">
              <Wallet className="w-6 h-6 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-white">Account Required</h3>
            <p className="text-gray-400 text-sm">Create an account with username & email, then connect your crypto wallet to start playing.</p>
            <div className="space-y-2 text-xs text-gray-500 mt-3">
              <div className="flex items-center justify-center space-x-2">
                <span className="text-cyan-400">1.</span>
                <User className="w-3 h-3" />
                <span>Create account (username + email)</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-cyan-400">2.</span>
                <Wallet className="w-3 h-3" />
                <span>Connect Phantom/Solflare wallet</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <span className="text-cyan-400">3.</span>
                <CheckCircle className="w-3 h-3" />
                <span>Start playing with real crypto!</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show wallet connection options when user is authenticated but wallet not connected
  if (!connected) {
    return (
      <div className="space-y-4">
        <div className="glass-panel p-4">
          <div className="text-center space-y-3">
            <div className="p-3 rounded-full bg-green-500/20 border border-green-500/50 w-12 h-12 flex items-center justify-center mx-auto">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Account Connected</h3>
            <p className="text-gray-400 text-sm">Welcome back! Now connect your crypto wallet to start playing.</p>
            
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium">{user.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h4 className="text-white font-semibold mb-3">Connect Your Wallet</h4>
          <WalletMultiButton className="!bg-gradient-to-r !from-purple-600 !to-cyan-600 !border-0 !rounded-lg !font-semibold hover:!from-purple-700 hover:!to-cyan-700 !transition-all !text-sm !py-3 !px-6 !w-full" />
          <p className="text-xs text-gray-500 mt-2">
            Supports Phantom, Solflare, and other Solana wallets
          </p>
        </div>
      </div>
    );
  }

  // Show wallet connected and backend connection step
  return (
    <div className="space-y-3">
      {/* User Account Info */}
      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Account: {user.email}</span>
        </div>
      </div>

      {/* Wallet Connected Info */}
      <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400 font-medium">Wallet Connected</span>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          {publicKey?.toBase58().slice(0, 16)}...
        </p>
      </div>

      {/* Backend Connection Step */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-3"
      >
        <button
          onClick={handleConnectToBackend}
          disabled={isConnecting || isLoading}
          className={`w-full py-3 rounded-lg font-semibold transition-all text-sm ${
            connectionStatus === 'success'
              ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-not-allowed'
              : connectionStatus === 'error'
              ? 'bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30'
              : 'bg-white text-gray-900 hover:bg-gray-100'
          }`}
        >
          {isConnecting ? (
            'Connecting to Casino...'
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center space-y-3"
          >
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-semibold">Ready to Play!</span>
              </div>
              <p className="text-xs text-gray-400 mb-3">
                Your wallet is connected! You can now make deposits and play with real crypto.
              </p>
              
              {balance && (
                <div className="space-y-2">
                  <div className="p-2 bg-white/5 rounded-lg">
                    <div className="text-sm text-gray-300">
                      Balance: <span className="text-white font-bold">{balance.balanceSol.toFixed(4)} SOL</span>
                    </div>
                  </div>
                  
                  {balance.balanceSol > 0.001 && (
                    <button
                      onClick={() => setShowWithdrawModal(true)}
                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Withdraw Funds</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              <a 
                href={`https://solscan.io/account/3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-gray-400 hover:text-gray-300 transition-colors"
              >
                <span>View House Wallet</span>
                <ExternalLink className="w-2 h-2" />
              </a>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} />
      )}
    </div>
  );
}
