import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle, Shield, Eye, Code, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Fairness() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Casino</span>
          </button>
          
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <h1 className="text-4xl font-bold text-white">Provably Fair Gaming</h1>
          </div>
          <p className="text-gray-400">Complete transparency in every game result. Verify fairness yourself.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* How It Works */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <Shield className="w-6 h-6 text-cyan-400" />
              <span>How Provably Fair Works</span>
            </h2>
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/30 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Code className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-semibold text-white">1. Server Seed</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    We generate a cryptographically secure server seed before each game.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Eye className="w-5 h-5 text-purple-400" />
                    <h3 className="font-semibold text-white">2. Client Seed</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    You provide a client seed or we generate one for you transparently.
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-teal-500/10 border border-green-400/30 rounded-lg p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    <Calculator className="w-5 h-5 text-green-400" />
                    <h3 className="font-semibold text-white">3. Result</h3>
                  </div>
                  <p className="text-gray-300 text-sm">
                    The result is calculated using both seeds, ensuring fairness.
                  </p>
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-3">Technical Details</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Each game result is generated using a combination of our server seed (kept secret until after the bet) 
                  and your client seed. The result is calculated using HMAC-SHA256 cryptographic hashing, 
                  which ensures that neither the house nor the player can predict or manipulate the outcome.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Process */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">How to Verify Your Bets</h2>
            <div className="space-y-4">
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Step 1: Check Your Game History</h3>
                <p className="text-gray-300 text-sm">
                  After each game, you can view the server seed hash, your client seed, and the nonce in your game history.
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Step 2: Get the Server Seed</h3>
                <p className="text-gray-300 text-sm">
                  Once you change your client seed, the previous server seed is revealed to you.
                </p>
              </div>
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-semibold text-white mb-2">Step 3: Verify the Result</h3>
                <p className="text-gray-300 text-sm">
                  Use our verification tool or any third-party verifier to confirm the game result matches the seeds.
                </p>
              </div>
            </div>
          </div>

          {/* Blockchain Integration */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Solana Blockchain Integration</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">On-Chain Transparency</h3>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span>All transactions are recorded on the Solana blockchain</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span>Game outcomes are stored immutably</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span>House wallet is publicly auditable</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                    <span>Instant payouts with smart contracts</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-400/30 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-3">Third-Party Verification</h3>
                <p className="text-gray-300 text-sm mb-4">
                  Our smart contracts are open source and audited. Anyone can verify our fairness algorithms.
                </p>
                <div className="space-y-2">
                  <a
                    href="https://github.com/coinhype/smart-contracts"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    🔗 View Smart Contracts
                  </a>
                  <a
                    href="https://solscan.io/account/3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    🔗 Audit House Wallet
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Tool */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Verification Tool</h2>
            <div className="bg-gray-800/30 rounded-lg p-6">
              <p className="text-gray-300 mb-4">
                Use our built-in verification tool to check any of your past bets:
              </p>
              <button className="neon-button">
                Open Verification Tool
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
