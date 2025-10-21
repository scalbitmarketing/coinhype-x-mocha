import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Share2, DollarSign, TrendingUp, Check, Loader, RefreshCw, Link } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface ReferralStats {
  referralCode: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  thisMonthEarnings: number;
  commissionRate: number;
  pendingPayments: number;
  referralLink: string;
}

export default function ReferralSystem() {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats>({
    referralCode: '',
    totalReferrals: 0,
    activeReferrals: 0,
    totalEarnings: 0,
    thisMonthEarnings: 0,
    commissionRate: 10,
    pendingPayments: 0,
    referralLink: ''
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReferralStats = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/referrals/stats', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch referral stats');
      }
      
      const data = await response.json();
      setReferralStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral data');
      console.error('Referral fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralStats();
  }, [user]);

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralStats.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralStats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join CoinHype Casino',
          text: 'Join me on CoinHype - the best crypto casino! Use my referral code for a bonus!',
          url: referralStats.referralLink,
        });
      } catch (err) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please sign in to access the referral program</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">Loading referral data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Referral Program</span>
        </h3>
        <button
          onClick={fetchReferralStats}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Referral Overview */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-lg border-2 border-purple-500/50 bg-purple-500/10"
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            🤝
          </motion.div>
          
          <h4 className="text-xl font-bold text-white mb-2">Earn {referralStats.commissionRate}% Commission</h4>
          <p className="text-gray-400 text-sm">
            Invite friends and earn {referralStats.commissionRate}% of their net losses forever!
          </p>
        </div>

        {/* Referral Code */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-600 text-white font-mono text-center">
              {referralStats.referralCode || 'Loading...'}
            </div>
            <button
              onClick={copyReferralCode}
              className="p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Referral Link */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Your Referral Link</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-3 bg-gray-800 rounded-lg border border-gray-600 text-white text-sm truncate">
              {referralStats.referralLink || 'Loading...'}
            </div>
            <button
              onClick={copyReferralLink}
              className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={shareReferralLink}
              className="p-3 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Referral Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-sm">Total Referrals</span>
          </div>
          <div className="text-xl font-bold text-white">{referralStats.totalReferrals}</div>
          <div className="text-xs text-gray-500">Active: {referralStats.activeReferrals}</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Total Earnings</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(referralStats.totalEarnings)}
          </div>
          <div className="text-xs text-gray-500">
            This month: {formatCurrency(referralStats.thisMonthEarnings)}
          </div>
        </motion.div>
      </div>

      {/* Pending Payments */}
      {referralStats.pendingPayments > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Pending Payment</span>
          </div>
          <div className="text-white">
            {formatCurrency(referralStats.pendingPayments)} will be paid within 24 hours
          </div>
        </motion.div>
      )}

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">How It Works</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <span>Share your referral code or link with friends</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <span>When they sign up and play, you earn {referralStats.commissionRate}% of their net losses</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <span>Earnings are paid automatically to your balance</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0" />
            <span>No limit on referrals or earnings</span>
          </div>
        </div>
      </motion.div>

      {/* Terms */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">Terms & Conditions</h4>
        <div className="text-xs text-gray-400 space-y-1">
          <p>• Commission is based on referred players' net losses only</p>
          <p>• Minimum payout threshold: ◎0.01</p>
          <p>• Payments processed within 24 hours</p>
          <p>• Self-referrals and fraudulent activity will result in account termination</p>
          <p>• Commission rate may change with 30 days notice</p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400"
        >
          {error}
        </motion.div>
      )}
    </div>
  );
}
