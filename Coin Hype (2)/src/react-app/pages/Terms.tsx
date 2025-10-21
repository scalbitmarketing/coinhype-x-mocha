import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Terms() {
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
          
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-gray-400">Last updated: October 21, 2025</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 space-y-8"
        >
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                By accessing and using CoinHype, you accept and agree to be bound by the
                terms and provision of this agreement. If you do not agree to abide by
                the above, please do not use this service.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Eligibility</h2>
            <div className="text-gray-300 space-y-4">
              <p>You must be at least 18 years old to use our services. By using CoinHype, you represent that:</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>You are of legal age in your jurisdiction</li>
                <li>You are not located in a restricted jurisdiction</li>
                <li>You have the legal capacity to enter into agreements</li>
                <li>Online gambling is legal in your jurisdiction</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Responsible Gaming</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                CoinHype promotes responsible gaming. Please gamble responsibly and never
                bet more than you can afford to lose. If you believe you have a gambling
                problem, please seek help immediately.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Provably Fair Gaming</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                All games on CoinHype use provably fair algorithms that allow you to
                verify the fairness of each game result. Game outcomes are determined
                by cryptographically secure random number generation.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Cryptocurrency Transactions</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                All transactions are processed on the Solana blockchain. Transaction times
                and fees are subject to network conditions. CoinHype is not responsible
                for blockchain network issues or delays.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Account Security</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                You are responsible for maintaining the security of your account and
                connected wallets. Never share your private keys or wallet access
                with anyone.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">7. Contact Information</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                For questions about these Terms of Service, please contact us at:
              </p>
              <p className="text-cyan-400">legal@coinhype.com</p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
