import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { X, ArrowUpRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface WithdrawModalProps {
  onClose: () => void;
}

export default function WithdrawModal({ onClose }: WithdrawModalProps) {
  const { publicKey } = useWallet();
  const { balance, refreshBalance } = useSolana();
  const [amount, setAmount] = useState('0.1');
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [txSignature, setTxSignature] = useState('');

  const maxWithdraw = balance ? balance.balanceSol - 0.001 : 0; // Leave some for transaction fees

  const handleWithdraw = async () => {
    if (!publicKey || !amount || parseFloat(amount) <= 0 || !balance) return;

    const withdrawAmount = parseFloat(amount);
    if (withdrawAmount > maxWithdraw) {
      setErrorMessage('Insufficient balance for withdrawal');
      return;
    }

    setStatus('processing');
    setErrorMessage('');

    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          amountSol: withdrawAmount,
          destinationAddress: publicKey.toBase58(),
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setTxSignature(result.transactionSignature);
        setStatus('success');
        await refreshBalance();
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      setStatus('error');
      setErrorMessage('Failed to process withdrawal');
    }
  };

  const presetAmounts = [0.1, 0.5, 1, 2];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-panel p-6 max-w-md w-full relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 hover:bg-white/10 rounded"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
              <ArrowUpRight className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Withdraw SOL</h2>
            <p className="text-gray-400">Send SOL to your connected wallet</p>
          </div>

          {status === 'idle' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Available Balance:</span>
                  <span className="text-lg font-bold text-white">
                    ◎{balance?.balanceSol.toFixed(4) || '0.0000'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">Max Withdraw:</span>
                  <span className="text-sm text-cyan-400">
                    ◎{maxWithdraw.toFixed(4)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.001"
                  max={maxWithdraw}
                  step="0.001"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="0.1"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
                    disabled={preset > maxWithdraw}
                    className={`py-2 text-sm rounded-lg border transition-colors ${
                      parseFloat(amount) === preset
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                        : preset > maxWithdraw
                        ? 'border-gray-700 bg-gray-800 text-gray-600 cursor-not-allowed'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-400 space-y-1">
                <p>• Minimum withdrawal: 0.001 SOL</p>
                <p>• Withdrawals are processed instantly</p>
                <p>• 0.001 SOL reserved for transaction fees</p>
                <p>• Destination: {publicKey?.toBase58().slice(0, 20)}...</p>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!publicKey || !amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxWithdraw}
                className="w-full neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Withdraw {amount} SOL
              </button>
            </div>
          )}

          {status === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Processing Withdrawal</h3>
                <p className="text-gray-400">Sending SOL to your wallet</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Withdrawal Successful!</h3>
                <p className="text-gray-400">SOL has been sent to your wallet</p>
                {txSignature && (
                  <div className="mt-4">
                    <a
                      href={`https://solscan.io/tx/${txSignature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:text-cyan-300 break-all underline"
                    >
                      View Transaction
                    </a>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Withdrawal Failed</h3>
                <p className="text-red-400 text-sm">{errorMessage}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
