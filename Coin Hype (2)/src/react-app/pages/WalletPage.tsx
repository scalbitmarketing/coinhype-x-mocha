import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useNavigate } from 'react-router';
import { 
  ArrowLeft, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Copy, 
  ExternalLink,
  Zap,
  Shield,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  X as XIcon,
  Send,
  User
} from 'lucide-react';
import DepositModal from '@/react-app/components/DepositModal';
import WithdrawModal from '@/react-app/components/WithdrawModal';

export default function WalletPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { publicKey, connected, disconnect } = useWallet();
  const { balance, refreshBalance, isLoading } = useSolana();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Tip functionality
  const [tipUsername, setTipUsername] = useState('');
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [usernameValidation, setUsernameValidation] = useState<'checking' | 'valid' | 'invalid' | null>(null);
  const [sending, setSending] = useState(false);
  const [tipSuccess, setTipSuccess] = useState('');
  const [tipError, setTipError] = useState('');

  const isRealMode = user && balance && connected;
  const displayBalance = isRealMode ? balance.balanceSol : 0;

  // Realtime balance updates
  useEffect(() => {
    if (isRealMode) {
      const interval = setInterval(() => {
        refreshBalance();
      }, 10000); // Update every 10 seconds

      return () => clearInterval(interval);
    }
  }, [isRealMode, refreshBalance]);

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

  // Username validation with debounce
  useEffect(() => {
    const validateUsername = async () => {
      if (!tipUsername.trim()) {
        setUsernameValidation(null);
        return;
      }

      setUsernameValidation('checking');
      
      try {
        const response = await fetch('/api/validate-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username: tipUsername })
        });
        
        const result = await response.json();
        setUsernameValidation(result.exists ? 'valid' : 'invalid');
      } catch (error) {
        setUsernameValidation('invalid');
      }
    };

    const debounceTimer = setTimeout(validateUsername, 500);
    return () => clearTimeout(debounceTimer);
  }, [tipUsername]);

  const sendTip = async () => {
    if (!tipUsername || !tipAmount || usernameValidation !== 'valid') return;
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setTipError('Please enter a valid tip amount');
      return;
    }

    if (amount > displayBalance) {
      setTipError('Insufficient balance');
      return;
    }

    try {
      setSending(true);
      setTipError('');
      
      const response = await fetch('/api/tip-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: tipUsername,
          amount,
          message: tipMessage || 'Good luck!'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        setTipSuccess(`Successfully tipped ◎${amount.toFixed(4)} to ${tipUsername}`);
        setTipUsername('');
        setTipAmount('');
        setTipMessage('');
        setUsernameValidation(null);
        await refreshBalance();
        setTimeout(() => setTipSuccess(''), 3000);
      } else {
        setTipError(result.error || 'Failed to send tip');
      }
    } catch (error) {
      setTipError('Failed to send tip');
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <header className="p-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate('/lobby')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Wallet</h1>
            <div className="w-9"></div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 text-lg mb-8">Login and connect a Solana wallet to start playing with real crypto</p>
            
            <button
              onClick={() => navigate('/auth/callback')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-purple-700 transition-colors"
            >
              Login with Google
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <header className="p-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Wallet</h1>
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-xs text-gray-400">Balance</div>
              <div className="text-lg font-bold text-white">
                ◎{displayBalance.toFixed(4)}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing || isLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Connection Status */}
        {!connected ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-center">
              <Wallet className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Solana Wallet</h2>
            <p className="text-gray-400 text-lg mb-8">Choose a wallet to start playing with real SOL</p>
            
            <WalletMultiButton className="!bg-gradient-to-r !from-cyan-600 !to-purple-600 !border-0 !rounded-lg !font-semibold hover:!from-cyan-700 hover:!to-purple-700 !transition-all !text-lg !py-4 !px-8" />
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Balance Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-8 border border-white/10"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Wallet Balance</h3>
                      <p className="text-gray-400 text-sm">Realtime SOL balance</p>
                    </div>
                  </div>
                  
                  <motion.div
                    key={displayBalance}
                    initial={{ scale: 1.05, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", damping: 20 }}
                    className="text-right cursor-pointer hover:scale-105 transition-transform p-2 rounded-lg hover:bg-white/5"
                    onClick={handleRefresh}
                  >
                    <div className="text-4xl font-bold text-white mb-1">
                      ◎{displayBalance.toFixed(4)}
                    </div>
                    <div className="text-lg text-gray-400">
                      ≈ ${(displayBalance * 150).toFixed(2)} USD
                    </div>
                    <div className="text-xs text-gray-500 opacity-70">
                      Tap to refresh
                    </div>
                  </motion.div>
                </div>

                {/* Wallet Address */}
                <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-400 mb-1">Connected Wallet</div>
                      <div className="text-sm font-mono text-white truncate">
                        {publicKey?.toBase58()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-3">
                      <button
                        onClick={copyAddress}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Copy className={`w-4 h-4 ${copied ? 'text-green-400' : 'text-gray-400'}`} />
                      </button>
                      <a
                        href={`https://solscan.io/account/${publicKey?.toBase58()}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => setShowDepositModal(true)}
                className="group flex items-center justify-center space-x-3 p-6 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ArrowDownLeft className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
                <span className="text-xl font-semibold text-white">Deposit SOL</span>
              </motion.button>

              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                onClick={() => setShowWithdrawModal(true)}
                disabled={displayBalance <= 0.001}
                className="group flex items-center justify-center space-x-3 p-6 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={displayBalance > 0.001 ? { scale: 1.02 } : {}}
                whileTap={displayBalance > 0.001 ? { scale: 0.98 } : {}}
              >
                <ArrowUpRight className="w-6 h-6 text-white group-hover:-rotate-12 transition-transform" />
                <span className="text-xl font-semibold text-white">Withdraw SOL</span>
              </motion.button>
            </div>

            {/* Tip User Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 rounded-lg bg-gray-800/50 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 rounded-lg bg-gradient-to-r from-pink-600 to-purple-600">
                  <Send className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Tip a Player</h3>
                  <p className="text-sm text-gray-400">Send SOL to another player by username</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="text-sm text-gray-400 block mb-2">Player Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={tipUsername}
                      onChange={(e) => setTipUsername(e.target.value)}
                      placeholder="Enter username..."
                      className="w-full pl-10 pr-12 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {usernameValidation === 'checking' && (
                        <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                      )}
                      {usernameValidation === 'valid' && (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      )}
                      {usernameValidation === 'invalid' && (
                        <XIcon className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount and Message */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Tip Amount (SOL)</label>
                    <input
                      type="number"
                      value={tipAmount}
                      onChange={(e) => setTipAmount(e.target.value)}
                      placeholder="0.0000"
                      step="0.0001"
                      min="0.0001"
                      max={displayBalance}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Message (Optional)</label>
                    <input
                      type="text"
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      placeholder="Good luck!"
                      maxLength={100}
                      className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={sendTip}
                  disabled={!tipUsername || !tipAmount || usernameValidation !== 'valid' || sending}
                  className="w-full p-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-bold transition-colors disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Send Tip'
                  )}
                </button>

                {/* Status Messages */}
                {tipSuccess && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                    {tipSuccess}
                  </div>
                )}
                {tipError && (
                  <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {tipError}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-4"
            >
              <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-white/5">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/20">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-xs text-gray-400">Instant</div>
                <div className="text-sm font-semibold text-white">Deposits</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-white/5">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-green-500/20">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-xs text-gray-400">Secure</div>
                <div className="text-sm font-semibold text-white">Wallet</div>
              </div>
              
              <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-white/5">
                <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 rounded-full bg-purple-500/20">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                </div>
                <div className="text-xs text-gray-400">Fast</div>
                <div className="text-sm font-semibold text-white">Payouts</div>
              </div>
            </motion.div>

            {/* Disconnect Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={disconnect}
              className="w-full p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
            >
              Disconnect Wallet
            </motion.button>
          </div>
        )}
      </main>

      {/* Modals */}
      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      
      {showWithdrawModal && (
        <WithdrawModal onClose={() => setShowWithdrawModal(false)} />
      )}
    </div>
  );
}
