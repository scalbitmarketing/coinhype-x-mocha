import { motion } from 'framer-motion';
import { ArrowLeft, Book, Play, CreditCard, Shield, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Guides() {
  const navigate = useNavigate();

  const guides = [
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Getting Started Guide",
      description: "Complete walkthrough for new players",
      difficulty: "Beginner",
      duration: "5 min read",
      topics: [
        "Creating your account",
        "Setting up your Solana wallet",
        "Making your first deposit",
        "Understanding the interface",
        "Playing your first game"
      ]
    },
    {
      icon: <CreditCard className="w-8 h-8 text-green-400" />,
      title: "Deposits & Withdrawals",
      description: "Everything about managing your funds",
      difficulty: "Beginner",
      duration: "3 min read",
      topics: [
        "How to deposit SOL",
        "Understanding network fees",
        "Withdrawal process",
        "Processing times",
        "Troubleshooting transactions"
      ]
    },
    {
      icon: <Play className="w-8 h-8 text-blue-400" />,
      title: "Game Strategies",
      description: "Tips and strategies for each game",
      difficulty: "Intermediate",
      duration: "10 min read",
      topics: [
        "Dice betting strategies",
        "Crash game timing",
        "Mines risk management",
        "Blackjack basic strategy",
        "Bankroll management"
      ]
    },
    {
      icon: <Shield className="w-8 h-8 text-purple-400" />,
      title: "Provably Fair Verification",
      description: "How to verify game fairness",
      difficulty: "Advanced",
      duration: "7 min read",
      topics: [
        "Understanding seeds and nonces",
        "Manual verification process",
        "Using verification tools",
        "Blockchain transparency",
        "Smart contract auditing"
      ]
    },
    {
      icon: <Users className="w-8 h-8 text-pink-400" />,
      title: "Referral Program",
      description: "Maximize earnings through referrals",
      difficulty: "Beginner",
      duration: "4 min read",
      topics: [
        "How the referral system works",
        "Commission structure",
        "Sharing your referral code",
        "Tracking referral earnings",
        "Withdrawal of commissions"
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
            <Book className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Guides & Tutorials</h1>
          </div>
          <p className="text-gray-400">Step-by-step guides to help you master CoinHype and maximize your gaming experience.</p>
        </motion.div>

        {/* Quick Start Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 mb-8 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">New to CoinHype?</h2>
              <p className="text-gray-300 mb-4">Start with our comprehensive getting started guide to learn the basics.</p>
              <button 
                onClick={() => navigate('/deposit-guide')}
                className="neon-button"
              >
                Quick Start Guide
              </button>
            </div>
            <div className="hidden md:block">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                <Play className="w-12 h-12 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Guides Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {guides.map((guide, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="glass-panel p-6 hover:scale-105 transition-transform cursor-pointer"
              onClick={() => {
                // In a real app, this would navigate to the specific guide
                alert(`Opening ${guide.title} guide...`);
              }}
            >
              <div className="flex items-center space-x-3 mb-4">
                {guide.icon}
                <div>
                  <h3 className="font-bold text-white">{guide.title}</h3>
                  <p className="text-xs text-gray-400">{guide.duration}</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm mb-4">{guide.description}</p>
              
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  guide.difficulty === 'Beginner' ? 'bg-green-600/20 text-green-400' :
                  guide.difficulty === 'Intermediate' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-red-600/20 text-red-400'
                }`}>
                  {guide.difficulty}
                </span>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Topics Covered:</h4>
                <ul className="space-y-1">
                  {guide.topics.slice(0, 3).map((topic, topicIndex) => (
                    <li key={topicIndex} className="text-xs text-gray-400 flex items-center space-x-2">
                      <div className="w-1 h-1 bg-cyan-400 rounded-full"></div>
                      <span>{topic}</span>
                    </li>
                  ))}
                  {guide.topics.length > 3 && (
                    <li className="text-xs text-cyan-400">
                      +{guide.topics.length - 3} more topics
                    </li>
                  )}
                </ul>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Video Tutorials Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Video Tutorials</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-6 flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">How to Get Started</h3>
                <p className="text-gray-300 text-sm mb-2">5 minute walkthrough for new users</p>
                <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                  Watch Video →
                </button>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-6 flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Play className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-1">Provably Fair Explained</h3>
                <p className="text-gray-300 text-sm mb-2">Understanding game fairness verification</p>
                <button className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
                  Watch Video →
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Need More Help */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Need More Help?</h2>
          <p className="text-gray-400 mb-6">
            Can't find the guide you're looking for? Check our FAQ or contact support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/faq')}
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Browse FAQ
            </button>
            <button 
              onClick={() => navigate('/contact')}
              className="neon-button"
            >
              Contact Support
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
