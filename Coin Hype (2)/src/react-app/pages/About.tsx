import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Zap, Users, Award, CheckCircle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function About() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Shield className="w-8 h-8 text-green-400" />,
      title: "Provably Fair",
      description: "Every game result is cryptographically verifiable, ensuring complete transparency and fairness."
    },
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Instant Payouts",
      description: "Withdrawals are processed instantly on the Solana blockchain with minimal fees."
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Community Driven",
      description: "Built by the community, for the community. We listen to feedback and continuously improve."
    },
    {
      icon: <Award className="w-8 h-8 text-purple-400" />,
      title: "Premium Experience",
      description: "Sleek design, smooth gameplay, and professional service that rivals traditional casinos."
    }
  ];

  const stats = [
    { label: "Players Served", value: "50,000+" },
    { label: "Games Available", value: "12+" },
    { label: "Total Volume", value: "100K SOL+" },
    { label: "Average Payout Time", value: "< 30s" }
  ];

  const teamValues = [
    "Transparency in all operations",
    "Fair gaming for everyone",
    "Security-first approach",
    "Community feedback integration",
    "Continuous innovation",
    "Responsible gambling practices"
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
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">CH</span>
              </div>
              <h1 className="text-4xl font-bold text-white">About CoinHype</h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              The premier Solana-based crypto casino delivering provably fair gaming, instant payouts, and an unmatched user experience.
            </p>
          </div>
        </motion.div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 mb-8 text-center bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400/30"
        >
          <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed max-w-4xl mx-auto">
            To revolutionize online gambling by leveraging blockchain technology to provide 
            the most transparent, fair, and exciting gaming experience possible. We believe 
            in empowering players with verifiable fairness and instant, secure transactions.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              className="glass-panel p-6 text-center"
            >
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center">What Sets Us Apart</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-start space-x-4"
              >
                {feature.icon}
                <div>
                  <h3 className="font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-6 mb-8"
        >
          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Built on Solana</h2>
            <div className="space-y-4">
              <p className="text-gray-300 text-sm leading-relaxed">
                CoinHype is built on the Solana blockchain, providing lightning-fast transactions 
                with minimal fees. This allows us to offer instant deposits and withdrawals 
                that traditional casinos simply cannot match.
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Sub-second transaction finality</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Fees under $0.01 per transaction</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Eco-friendly proof-of-stake consensus</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300 text-sm">Decentralized and censorship-resistant</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-panel p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Our Values</h2>
            <div className="space-y-3">
              {teamValues.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start space-x-2"
                >
                  <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2"></div>
                  <span className="text-gray-300 text-sm">{value}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Security & Compliance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Security & Compliance</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Security Measures</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>SSL encryption for all data transmission</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Cold storage for house funds</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Regular security audits and penetration testing</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Multi-signature wallet protection</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-cyan-400 mb-4">Compliance</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Responsible gambling tools and resources</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Age verification and KYC procedures</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Anti-money laundering (AML) compliance</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                  <span>Regular compliance audits</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact & Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-8 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Get In Touch</h2>
          <p className="text-gray-300 mb-6">
            Have questions about CoinHype? Want to learn more about our technology? 
            We'd love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => navigate('/contact')}
              className="neon-button"
            >
              Contact Us
            </button>
            <a
              href="https://github.com/coinhype"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
