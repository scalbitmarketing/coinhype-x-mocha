import { useState } from 'react';
import { motion } from 'framer-motion';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { X, Send, CheckCircle, AlertCircle, Loader2, HelpCircle } from 'lucide-react';
import HowToDepositGuide from './HowToDepositGuide';

interface DepositModalProps {
  onClose: () => void;
}

export default function DepositModal({ onClose }: DepositModalProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { deposit } = useSolana();
  const [amount, setAmount] = useState('0.1');
  const [status, setStatus] = useState<'idle' | 'sending' | 'confirming' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [txSignature, setTxSignature] = useState('');
  const [showGuide, setShowGuide] = useState(false);

  const houseWallet = new PublicKey('3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7');

  const handleDeposit = async () => {
    if (!publicKey || !amount || parseFloat(amount) <= 0) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      // Create transaction
      const lamports = Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: houseWallet,
          lamports,
        })
      );

      // Get latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      setTxSignature(signature);
      setStatus('confirming');

      // Wait for confirmation
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error('Transaction failed on blockchain');
      }

      // Process deposit on backend
      const result = await deposit(signature);
      
      if (result.success) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to process deposit');
      }

    } catch (error) {
      console.error('Deposit error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send transaction');
    }
  };

  const presetAmounts = [0.1, 0.5, 1, 2, 5];

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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
              <Send className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Deposit SOL</h2>
              <button
                onClick={() => setShowGuide(!showGuide)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                title="How to deposit"
              >
                <HelpCircle className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-gray-400">Add SOL to your casino balance</p>
          </div>

          {showGuide ? (
            <HowToDepositGuide onClose={() => setShowGuide(false)} />
          ) : status === 'idle' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.001"
                  max="100"
                  step="0.001"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  placeholder="0.1"
                />
              </div>

              <div className="grid grid-cols-5 gap-2">
                {presetAmounts.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset.toString())}
                    className={`py-2 text-sm rounded-lg border transition-colors ${
                      parseFloat(amount) === preset
                        ? 'border-cyan-400 bg-cyan-400/20 text-cyan-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <div className="text-sm text-gray-400 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Instant deposits with 1-2 confirmations</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Minimum: 0.001 SOL (~$0.15)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Maximum: 100 SOL per transaction</span>
                </div>
                <div className="pt-2 border-t border-gray-600/30">
                  <p className="text-xs">House: {houseWallet.toBase58().slice(0, 20)}...</p>
                </div>
              </div>

              <button
                onClick={handleDeposit}
                disabled={!publicKey || !amount || parseFloat(amount) <= 0}
                className="w-full neon-button py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Deposit {amount} SOL
              </button>
            </div>
          )}

          {status === 'sending' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Sending Transaction</h3>
                <p className="text-gray-400">Please approve the transaction in your wallet</p>
              </div>
            </div>
          )}

          {status === 'confirming' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 text-yellow-400 animate-spin mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Confirming Transaction</h3>
                <p className="text-gray-400">Waiting for blockchain confirmation</p>
                {txSignature && (
                  <p className="text-xs text-gray-500 mt-2 font-mono break-all">
                    {txSignature}
                  </p>
                )}
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Deposit Successful!</h3>
                <p className="text-gray-400">Your SOL has been added to your balance</p>
                <button
                  onClick={onClose}
                  className="mt-4 px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Continue Playing
                </button>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-white">Deposit Failed</h3>
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
