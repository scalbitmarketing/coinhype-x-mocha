import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, MessageCircle, Book, Zap, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Help() {
  const navigate = useNavigate();

  const helpSections = [
    {
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      title: "Getting Started",
      description: "Learn how to create an account and start playing",
      items: [
        "Creating your account",
        "Connecting your Solana wallet",
        "Making your first deposit",
        "Understanding the interface"
      ]
    },
    {
      icon: <CreditCard className="w-6 h-6 text-green-400" />,
      title: "Deposits & Withdrawals",
      description: "Managing your funds safely and securely",
      items: [
        "How to deposit SOL",
        "Withdrawal process",
        "Transaction fees",
        "Processing times"
      ]
    },
    {
      icon: <Book className="w-6 h-6 text-blue-400" />,
      title: "Games & Rules",
      description: "Understanding how our games work",
      items: [
        "Game rules and strategies",
        "Provably fair verification",
        "Bet limits and payouts",
        "Game history tracking"
      ]
    },
    {
      icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
      title: "Account Management",
      description: "Managing your CoinHype account",
      items: [
        "Account settings",
        "Security features",
        "Responsible gaming tools",
        "Referral system"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-6xl mx-auto px-6 py-8">
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
            <HelpCircle className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Help Center</h1>
          </div>
          <p className="text-gray-400">Find answers to common questions and get support when you need it.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-8"
        >
          {/* Quick Actions */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/contact')}
                className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-lg p-6 text-left hover:from-cyan-500/30 hover:to-blue-500/30 transition-all"
              >
                <MessageCircle className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Contact Support</h3>
                <p className="text-gray-300 text-sm">Get help from our support team</p>
              </button>
              <button 
                onClick={() => navigate('/faq')}
                className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-lg p-6 text-left hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
              >
                <HelpCircle className="w-8 h-8 text-purple-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">FAQ</h3>
                <p className="text-gray-300 text-sm">Browse frequently asked questions</p>
              </button>
              <button 
                onClick={() => navigate('/guides')}
                className="bg-gradient-to-br from-green-500/20 to-teal-500/20 border border-green-400/30 rounded-lg p-6 text-left hover:from-green-500/30 hover:to-teal-500/30 transition-all"
              >
                <Book className="w-8 h-8 text-green-400 mb-3" />
                <h3 className="font-semibold text-white mb-2">Guides</h3>
                <p className="text-gray-300 text-sm">Step-by-step tutorials</p>
              </button>
            </div>
          </div>

          {/* Help Sections */}
          <div className="grid md:grid-cols-2 gap-6">
            {helpSections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="glass-panel p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  {section.icon}
                  <h3 className="text-xl font-bold text-white">{section.title}</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4">{section.description}</p>
                <ul className="space-y-2">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-gray-400 text-sm flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Contact Information */}
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Still Need Help?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Contact Methods</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300 text-sm">Live Chat: Available 24/7</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 text-gray-400">📧</div>
                    <span className="text-gray-300 text-sm">Email: support@coinhype.com</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 text-gray-400">⏰</div>
                    <span className="text-gray-300 text-sm">Response Time: Usually within 1 hour</span>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-lg p-6">
                <h3 className="font-semibold text-white mb-3">Before Contacting Support</h3>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Check our FAQ section</li>
                  <li>• Have your account details ready</li>
                  <li>• Include transaction IDs if relevant</li>
                  <li>• Describe the issue clearly</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
