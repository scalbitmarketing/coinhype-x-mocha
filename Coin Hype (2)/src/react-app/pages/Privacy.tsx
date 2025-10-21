import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Privacy() {
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
          
          <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-400">Last updated: October 21, 2025</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 space-y-8"
        >
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <div className="text-gray-300 space-y-4">
              <p>We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Create an account or authenticate with Google</li>
                <li>Connect your Solana wallet</li>
                <li>Play games on our platform</li>
                <li>Contact us for support</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <div className="text-gray-300 space-y-4">
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Provide and maintain our gaming services</li>
                <li>Process cryptocurrency transactions</li>
                <li>Ensure fair gaming and prevent fraud</li>
                <li>Communicate with you about your account</li>
                <li>Improve our platform and user experience</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Blockchain Data</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                Our platform operates on the Solana blockchain. All transactions are recorded
                on the public blockchain and cannot be modified or deleted. This includes:
              </p>
              <ul className="list-disc list-inside pl-4 space-y-2">
                <li>Wallet addresses</li>
                <li>Transaction amounts and timestamps</li>
                <li>Game outcomes (for provably fair verification)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                We implement industry-standard security measures to protect your data,
                including encryption, secure servers, and regular security audits.
                However, no method of transmission over the internet is 100% secure.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
            <div className="text-gray-300 space-y-4">
              <p>
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-cyan-400">privacy@coinhype.com</p>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}
