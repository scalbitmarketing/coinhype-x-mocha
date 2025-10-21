import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, BarChart3, Calendar, Loader, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface RakebackStats {
  currentRate: number;
  totalRakeback: number;
  thisWeekRakeback: number;
  thisMonthRakeback: number;
  totalRaked: number;
  nextTier: {
    name: string;
    rate: number;
    requirement: number;
  } | null;
  progressToNext: number;
  pendingRakeback: number;
  vipMultiplier: number;
}

interface RakebackHistory {
  id: string;
  amount: number;
  period: string;
  timestamp: string;
  type: 'weekly' | 'monthly' | 'instant';
}

const RAKEBACK_TIERS = [
  { name: 'Bronze', rate: 5, requirement: 0 },
  { name: 'Silver', rate: 7, requirement: 100 },
  { name: 'Gold', rate: 10, requirement: 500 },
  { name: 'Diamond', rate: 15, requirement: 2500 },
  { name: 'Elite', rate: 20, requirement: 10000 }
];

export default function Rakeback() {
  const { user } = useAuth();
  const [rakebackStats, setRakebackStats] = useState<RakebackStats>({
    currentRate: 5,
    totalRakeback: 0,
    thisWeekRakeback: 0,
    thisMonthRakeback: 0,
    totalRaked: 0,
    nextTier: null,
    progressToNext: 0,
    pendingRakeback: 0,
    vipMultiplier: 1
  });
  const [rakebackHistory, setRakebackHistory] = useState<RakebackHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRakebackData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Mock data - in real app, fetch from API
      const totalRaked = Math.random() * 1000;
      const currentTier = RAKEBACK_TIERS.find(tier => totalRaked >= tier.requirement) || RAKEBACK_TIERS[0];
      const nextTier = RAKEBACK_TIERS.find(tier => tier.requirement > totalRaked) || null;
      
      let progressToNext = 0;
      if (nextTier) {
        const currentReq = currentTier.requirement;
        const nextReq = nextTier.requirement;
        progressToNext = ((totalRaked - currentReq) / (nextReq - currentReq)) * 100;
      }
      
      setRakebackStats({
        currentRate: currentTier.rate,
        totalRakeback: totalRaked * (currentTier.rate / 100),
        thisWeekRakeback: Math.random() * 10,
        thisMonthRakeback: Math.random() * 50,
        totalRaked,
        nextTier,
        progressToNext,
        pendingRakeback: Math.random() * 5,
        vipMultiplier: 1.2 // VIP multiplier
      });
      
      // Generate mock history
      const mockHistory: RakebackHistory[] = [];
      for (let i = 0; i < 10; i++) {
        mockHistory.push({
          id: Math.random().toString(36).substr(2, 9),
          amount: Math.random() * 20,
          period: ['Week 1', 'Week 2', 'Week 3', 'Month 1'][Math.floor(Math.random() * 4)],
          timestamp: new Date(Date.now() - Math.random() * 2592000000).toISOString(),
          type: ['weekly', 'monthly', 'instant'][Math.floor(Math.random() * 3)] as 'weekly' | 'monthly' | 'instant'
        });
      }
      setRakebackHistory(mockHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rakeback data');
      console.error('Rakeback fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRakebackData();
  }, [user]);

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  

  const getTypeBadge = (type: RakebackHistory['type']) => {
    const colors = {
      weekly: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      monthly: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      instant: 'bg-green-500/20 text-green-400 border-green-500/30'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${colors[type]} capitalize`}>
        {type}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please sign in to view rakeback rewards</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">Loading rakeback data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <DollarSign className="w-5 h-5" />
          <span>Rakeback Rewards</span>
        </h3>
        <button
          onClick={fetchRakebackData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Rakeback Rate */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-lg border-2 border-green-500/50 bg-green-500/10"
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
            💰
          </motion.div>
          
          <h4 className="text-xl font-bold text-white mb-2">
            {formatPercentage(rakebackStats.currentRate * rakebackStats.vipMultiplier)} Rakeback Rate
          </h4>
          <p className="text-gray-400 text-sm">
            Earn back a percentage of your total wagers automatically
          </p>
          
          {rakebackStats.vipMultiplier > 1 && (
            <div className="mt-2 inline-block px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-400 text-sm">
              VIP Bonus: {formatPercentage((rakebackStats.vipMultiplier - 1) * 100)} extra
            </div>
          )}
        </div>

        {/* Progress to Next Tier */}
        {rakebackStats.nextTier && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Progress to {rakebackStats.nextTier.name} ({formatPercentage(rakebackStats.nextTier.rate)})
              </span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(rakebackStats.totalRaked)} / {formatCurrency(rakebackStats.nextTier.requirement)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-green-500 to-cyan-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${rakebackStats.progressToNext}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatCurrency(rakebackStats.nextTier.requirement - rakebackStats.totalRaked)} needed for next tier
            </div>
          </div>
        )}
      </motion.div>

      {/* Rakeback Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Total Rakeback</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(rakebackStats.totalRakeback)}
          </div>
          <div className="text-xs text-gray-500">
            From {formatCurrency(rakebackStats.totalRaked)} wagered
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400 text-sm">This Week</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatCurrency(rakebackStats.thisWeekRakeback)}
          </div>
          <div className="text-xs text-gray-500">
            Month: {formatCurrency(rakebackStats.thisMonthRakeback)}
          </div>
        </motion.div>
      </div>

      {/* Pending Rakeback */}
      {rakebackStats.pendingRakeback > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
        >
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">Pending Rakeback</span>
          </div>
          <div className="text-white">
            {formatCurrency(rakebackStats.pendingRakeback)} will be paid within 24 hours
          </div>
        </motion.div>
      )}

      {/* Rakeback Tiers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">Rakeback Tiers</h4>
        <div className="space-y-2">
          {RAKEBACK_TIERS.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className={`p-3 rounded-lg border transition-all ${
                rakebackStats.totalRaked >= tier.requirement
                  ? 'border-green-500/30 bg-green-500/10'
                  : 'border-gray-600/30 bg-gray-800/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`text-lg ${
                    rakebackStats.totalRaked >= tier.requirement ? 'text-green-400' : 'text-gray-500'
                  }`}>
                    {rakebackStats.totalRaked >= tier.requirement ? '✅' : '⭕'}
                  </div>
                  <div>
                    <div className={`font-bold ${
                      rakebackStats.totalRaked >= tier.requirement ? 'text-green-400' : 'text-gray-400'
                    }`}>
                      {tier.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatCurrency(tier.requirement)} wagered
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white">{formatPercentage(tier.rate)}</div>
                  <div className="text-xs text-gray-400">Rakeback</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Rakeback History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">Rakeback History</h4>
        
        {rakebackHistory.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No rakeback payments yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {rakebackHistory.map(payment => (
              <motion.div
                key={payment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-gray-700/50 border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-white text-sm font-medium">
                      {payment.period} Rakeback
                    </span>
                    {getTypeBadge(payment.type)}
                  </div>
                  <span className="text-green-400 font-bold">
                    +{formatCurrency(payment.amount)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">{formatDate(payment.timestamp)}</div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* How It Works */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">How Rakeback Works</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            <span>Play any game and your total wagers count towards rakeback</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            <span>Rakeback is calculated as a percentage of your total wagers</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            <span>Payments are processed automatically every week</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            <span>Higher tiers unlock by wagering more and offer better rates</span>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0" />
            <span>VIP members get bonus multipliers on their rakeback rate</span>
          </div>
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
