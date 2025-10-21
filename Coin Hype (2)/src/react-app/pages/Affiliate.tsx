import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Users, TrendingUp, Gift, Copy, Check } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useState } from 'react';

export default function Affiliate() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  
  // Mock referral code - in real app this would come from user data
  const referralCode = 'COINHYPE2025';
  const referralLink = `https://coinhype.mocha.app/?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const benefits = [
    {
      icon: <DollarSign className="w-8 h-8 text-green-400" />,
      title: "10% Commission",
      description: "Earn 10% of all losses from players you refer"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Lifetime Earnings",
      description: "Earn commission for the lifetime of referred players"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-400" />,
      title: "Real-time Tracking",
      description: "Monitor your referrals and earnings in real-time"
    },
    {
      icon: <Gift className="w-8 h-8 text-pink-400" />,
      title: "Bonus Rewards",
      description: "Extra bonuses for high-performing affiliates"
    }
  ];

  const tiers = [
    {
      name: "Bronze",
      referrals: "1-10",
      commission: "10%",
      bonus: "None",
      color: "from-orange-600/20 to-yellow-600/20 border-orange-400/30"
    },
    {
      name: "Silver",
      referrals: "11-50",
      commission: "12%",
      bonus: "50 SOL",
      color: "from-gray-400/20 to-gray-600/20 border-gray-400/30"
    },
    {
      name: "Gold",
      referrals: "51-100",
      commission: "15%",
      bonus: "100 SOL",
      color: "from-yellow-400/20 to-yellow-600/20 border-yellow-400/30"
    },
    {
      name: "Diamond",
      referrals: "100+",
      commission: "20%",
      bonus: "500 SOL",
      color: "from-cyan-400/20 to-blue-600/20 border-cyan-400/30"
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
            <h1 className="text-4xl font-bold text-white">Affiliate Program</h1>
          </div>
          <p className="text-gray-400">Earn money by referring players to CoinHype. Start earning passive income today.</p>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-8 mb-8 bg-gradient-to-r from-green-500/10 to-cyan-500/10 border-green-400/30"
        >
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Earn Up To 20% Commission</h2>
            <p className="text-xl text-gray-300 mb-6">
              Get paid for every player you bring to CoinHype. No limits, no caps.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/create-account')}
                className="neon-button"
              >
                Start Earning Now
              </button>
              <button className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Why Join Our Affiliate Program?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="text-center"
              >
                <div className="flex justify-center mb-4">
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-white mb-2">{benefit.title}</h3>
                <p className="text-gray-300 text-sm">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Commission Tiers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Commission Tiers</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`bg-gradient-to-br ${tier.color} rounded-lg p-6 text-center`}
              >
                <h3 className="text-xl font-bold text-white mb-4">{tier.name}</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-2xl font-bold text-white">{tier.commission}</div>
                    <div className="text-sm text-gray-400">Commission Rate</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">{tier.referrals}</div>
                    <div className="text-sm text-gray-400">Referrals Required</div>
                  </div>
                  <div>
                    <div className="font-medium text-white">{tier.bonus}</div>
                    <div className="text-sm text-gray-400">Tier Bonus</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Referral Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Your Referral Link</h2>
          <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Referral Code</h3>
              <span className="text-cyan-400 font-mono text-lg">{referralCode}</span>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="neon-button flex items-center space-x-2 px-4 py-3"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-gray-400 text-sm mt-3">
              Share this link with friends to start earning commissions on their gameplay.
            </p>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-white mb-2">Share Your Link</h3>
              <p className="text-gray-300 text-sm">Share your unique referral link on social media, forums, or with friends.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-white mb-2">Players Join</h3>
              <p className="text-gray-300 text-sm">When someone clicks your link and signs up, they become your referral.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-white mb-2">Earn Commission</h3>
              <p className="text-gray-300 text-sm">Earn commission on all losses from your referred players, paid instantly.</p>
            </div>
          </div>
        </motion.div>

        {/* Terms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-panel p-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Terms & Conditions</h2>
          <div className="space-y-4 text-gray-300 text-sm">
            <p>• Commission is paid on net losses only (total losses minus total wins)</p>
            <p>• Minimum withdrawal amount is 0.1 SOL</p>
            <p>• Commissions are paid instantly to your CoinHype balance</p>
            <p>• Referrals must be genuine - fake accounts will result in disqualification</p>
            <p>• Self-referrals are not allowed</p>
            <p>• CoinHype reserves the right to modify commission rates with 30 days notice</p>
            <p>• Affiliates promoting on prohibited channels may have their accounts suspended</p>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs">
              By participating in our affiliate program, you agree to these terms and conditions.
              For questions, please contact our support team.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
