import { motion } from 'framer-motion';
import { ArrowLeft, Users, MessageCircle, Trophy, Star, ExternalLink, Twitter, Github } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function Community() {
  const navigate = useNavigate();

  const communityStats = [
    { label: 'Total Players', value: '50,000+', icon: <Users className="w-5 h-5" /> },
    { label: 'Games Played', value: '2.5M+', icon: <Trophy className="w-5 h-5" /> },
    { label: 'SOL Wagered', value: '100K+', icon: <Star className="w-5 h-5" /> },
    { label: 'Community Members', value: '15,000+', icon: <MessageCircle className="w-5 h-5" /> }
  ];

  const socialChannels = [
    {
      name: 'Twitter',
      description: 'Latest updates, announcements, and community highlights',
      members: '12,000 followers',
      icon: <Twitter className="w-6 h-6 text-blue-400" />,
      url: 'https://twitter.com/coinhype',
      color: 'from-blue-500/20 to-cyan-500/20 border-blue-400/30'
    },
    {
      name: 'Discord',
      description: 'Real-time chat, tournaments, and exclusive events',
      members: '8,500 members',
      icon: <MessageCircle className="w-6 h-6 text-purple-400" />,
      url: 'https://discord.gg/coinhype',
      color: 'from-purple-500/20 to-indigo-500/20 border-purple-400/30'
    },
    {
      name: 'Telegram',
      description: 'Quick announcements and community discussions',
      members: '5,200 members',
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      url: 'https://t.me/coinhype',
      color: 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30'
    },
    {
      name: 'GitHub',
      description: 'Open source code, contributions welcome',
      members: '250 stars',
      icon: <Github className="w-6 h-6 text-gray-400" />,
      url: 'https://github.com/coinhype',
      color: 'from-gray-500/20 to-slate-500/20 border-gray-400/30'
    }
  ];

  const communityFeatures = [
    {
      title: 'Weekly Tournaments',
      description: 'Compete with other players in weekly tournaments with SOL prizes',
      icon: <Trophy className="w-8 h-8 text-yellow-400" />
    },
    {
      title: 'Community Events',
      description: 'Special events, giveaways, and exclusive promotions for members',
      icon: <Star className="w-8 h-8 text-purple-400" />
    },
    {
      title: 'Beta Testing',
      description: 'Get early access to new games and features before public release',
      icon: <Users className="w-8 h-8 text-green-400" />
    },
    {
      title: 'Community Support',
      description: 'Get help from experienced players and community moderators',
      icon: <MessageCircle className="w-8 h-8 text-blue-400" />
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
            <Users className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold text-white">Community Hub</h1>
          </div>
          <p className="text-gray-400">Join thousands of players in the CoinHype community. Connect, compete, and win together.</p>
        </motion.div>

        {/* Community Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {communityStats.map((stat, index) => (
            <div key={index} className="glass-panel p-6 text-center">
              <div className="flex items-center justify-center mb-2 text-cyan-400">
                {stat.icon}
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Social Channels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Join Our Community</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {socialChannels.map((channel, index) => (
              <motion.a
                key={index}
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-gradient-to-br ${channel.color} rounded-lg p-6 hover:scale-105 transition-transform block`}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {channel.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-white">{channel.name}</h3>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{channel.description}</p>
                    <div className="text-xs text-gray-400">{channel.members}</div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* Community Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Community Benefits</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {communityFeatures.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="bg-gray-800/50 rounded-lg p-6"
              >
                <div className="flex items-start space-x-4">
                  {feature.icon}
                  <div>
                    <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                    <p className="text-gray-300 text-sm">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Community Guidelines */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Community Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Do's</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm">Be respectful to all community members</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm">Share tips and strategies with others</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm">Help newcomers learn the platform</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2"></div>
                  <span className="text-sm">Report issues and provide feedback</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-4">Don'ts</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-sm">Spam or share referral links excessively</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-sm">Use offensive or inappropriate language</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-sm">Share personal financial information</span>
                </li>
                <li className="flex items-start space-x-2">
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2"></div>
                  <span className="text-sm">Promote other gambling platforms</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Get Involved */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Ready to Join?</h2>
          <p className="text-gray-400 mb-6">
            Connect with players worldwide and be part of the CoinHype community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="https://discord.gg/coinhype"
              target="_blank"
              rel="noopener noreferrer"
              className="neon-button flex items-center justify-center space-x-2"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Join Discord</span>
            </a>
            <a
              href="https://twitter.com/coinhype"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Twitter className="w-4 h-4" />
              <span>Follow on Twitter</span>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
