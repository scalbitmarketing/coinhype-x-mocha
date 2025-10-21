import { motion } from 'framer-motion';
import { ArrowLeft, Wallet, ArrowRight, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function DepositGuide() {
  const navigate = useNavigate();

  const steps = [
    {
      step: 1,
      title: "Install a Solana Wallet",
      description: "Choose and install a compatible Solana wallet",
      details: [
        "We recommend Phantom for beginners",
        "Solflare and Torus are also supported",
        "Available as browser extension or mobile app",
        "Create a new wallet and save your seed phrase securely"
      ]
    },
    {
      step: 2,
      title: "Buy Solana (SOL)",
      description: "Purchase SOL tokens to fund your wallet",
      details: [
        "Use exchanges like Coinbase, Binance, or FTX",
        "You can also buy directly in Phantom wallet",
        "Minimum deposit: 0.01 SOL",
        "Consider network fees when purchasing"
      ]
    },
    {
      step: 3,
      title: "Connect Your Wallet",
      description: "Connect your wallet to CoinHype",
      details: [
        "Click 'Connect Wallet' in the top right",
        "Select your wallet type (Phantom, Solflare, etc.)",
        "Approve the connection in your wallet",
        "Your wallet address will appear in the header"
      ]
    },
    {
      step: 4,
      title: "Make a Deposit",
      description: "Transfer SOL to your CoinHype balance",
      details: [
        "Click the 'Deposit' button",
        "Enter the amount you want to deposit",
        "Confirm the transaction in your wallet",
        "Funds appear in your balance within 30 seconds"
      ]
    }
  ];

  const wallets = [
    {
      name: "Phantom",
      description: "Most popular Solana wallet with great UX",
      features: ["Easy to use", "Built-in SOL purchase", "Mobile & Browser"],
      recommended: true,
      url: "https://phantom.app"
    },
    {
      name: "Solflare",
      description: "Feature-rich wallet for advanced users",
      features: ["Advanced features", "Hardware wallet support", "Staking"],
      recommended: false,
      url: "https://solflare.com"
    },
    {
      name: "Torus",
      description: "Social login wallet for easy onboarding",
      features: ["Google/Facebook login", "No seed phrase", "Beginner friendly"],
      recommended: false,
      url: "https://toruswallet.io"
    }
  ];

  const faqs = [
    {
      question: "How long do deposits take?",
      answer: "Deposits are usually instant but can take up to 30 seconds during network congestion."
    },
    {
      question: "Are there any deposit fees?",
      answer: "CoinHype doesn't charge deposit fees, but you'll pay standard Solana network fees (usually < $0.01)."
    },
    {
      question: "What's the minimum deposit?",
      answer: "The minimum deposit is 0.01 SOL to ensure network fees don't consume your entire deposit."
    },
    {
      question: "Can I deposit other cryptocurrencies?",
      answer: "Currently, we only support SOL deposits. We may add support for SPL tokens in the future."
    }
  ];

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
            <Wallet className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">How to Deposit</h1>
          </div>
          <p className="text-gray-400">Complete guide to making your first deposit on CoinHype. Start playing in minutes!</p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6 mb-8 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-400/30"
        >
          <div className="flex items-center space-x-3 mb-3">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <h2 className="text-xl font-bold text-white">Already have a Solana wallet?</h2>
          </div>
          <p className="text-gray-300 mb-4">
            If you already have SOL in a compatible wallet, you can start playing right away!
          </p>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="neon-button"
            >
              Connect Wallet & Play
            </button>
            <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
              Need help? Continue reading →
            </button>
          </div>
        </motion.div>

        {/* Step-by-Step Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-panel p-8"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-300 mb-4">{step.description}</p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start space-x-2">
                        <ArrowRight className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300 text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Recommended Wallets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recommended Wallets</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {wallets.map((wallet, index) => (
              <motion.a
                key={index}
                href={wallet.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`block p-6 rounded-lg border transition-all hover:scale-105 ${
                  wallet.recommended
                    ? 'bg-gradient-to-br from-green-500/20 to-cyan-500/20 border-green-400/50'
                    : 'bg-gray-800/50 border-gray-600/50 hover:border-gray-500/50'
                }`}
              >
                {wallet.recommended && (
                  <div className="text-green-400 text-xs font-bold mb-2 flex items-center">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    RECOMMENDED
                  </div>
                )}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-white">{wallet.name}</h3>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
                <p className="text-gray-300 text-sm mb-4">{wallet.description}</p>
                <ul className="space-y-1">
                  {wallet.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="text-xs text-gray-400 flex items-center space-x-2">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 mb-8"
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            <h2 className="text-2xl font-bold text-white">Important Security Notes</h2>
          </div>
          <div className="space-y-3 text-gray-300">
            <p className="flex items-start space-x-2">
              <span className="text-orange-400 mt-1">⚠️</span>
              <span className="text-sm">Never share your seed phrase or private keys with anyone, including CoinHype support.</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-orange-400 mt-1">⚠️</span>
              <span className="text-sm">Always verify you're on the correct website (coinhype.mocha.app) before connecting your wallet.</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-orange-400 mt-1">⚠️</span>
              <span className="text-sm">Start with small amounts until you're comfortable with the process.</span>
            </p>
            <p className="flex items-start space-x-2">
              <span className="text-orange-400 mt-1">⚠️</span>
              <span className="text-sm">Keep your wallet software updated to the latest version.</span>
            </p>
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-800/50 rounded-lg p-4"
              >
                <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300 text-sm">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Need Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
          <p className="text-gray-400 mb-6">
            Our support team is available 24/7 to help you get started.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/contact')}
              className="neon-button"
            >
              Contact Support
            </button>
            <button 
              onClick={() => navigate('/faq')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              View FAQ
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
