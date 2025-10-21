import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Calendar, Loader } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface VipTier {
  id: number;
  name: string;
  minDeposit: number;
  benefits: string[];
  color: string;
  icon: string;
}

interface VipStatus {
  isVip: boolean;
  currentTier: VipTier | null;
  totalDeposited: number;
  nextTier: VipTier | null;
  progressToNext: number;
  joinDate: string | null;
  bonusesEarned: number;
}

const VIP_TIERS: VipTier[] = [
  {
    id: 0,
    name: 'Bronze',
    minDeposit: 25,
    benefits: [
      'VIP Badge',
      'Priority Support',
      '5% Rakeback',
      'Weekly Bonus'
    ],
    color: 'text-orange-400',
    icon: '🥉'
  },
  {
    id: 1,
    name: 'Silver',
    minDeposit: 100,
    benefits: [
      'All Bronze Benefits',
      'Higher Deposit Limits',
      '7% Rakeback',
      'Bi-weekly Bonus',
      'Exclusive Tournaments'
    ],
    color: 'text-gray-300',
    icon: '🥈'
  },
  {
    id: 2,
    name: 'Gold',
    minDeposit: 500,
    benefits: [
      'All Silver Benefits',
      'Personal Account Manager',
      '10% Rakeback',
      'Daily Bonus',
      'VIP Events Access'
    ],
    color: 'text-yellow-400',
    icon: '🥇'
  },
  {
    id: 3,
    name: 'Diamond',
    minDeposit: 2500,
    benefits: [
      'All Gold Benefits',
      'Custom Betting Limits',
      '15% Rakeback',
      'Premium Rewards',
      'Exclusive VIP Games'
    ],
    color: 'text-cyan-400',
    icon: '💎'
  }
];

export default function VipProgram() {
  const { user } = useAuth();
  const [vipStatus, setVipStatus] = useState<VipStatus>({
    isVip: false,
    currentTier: null,
    totalDeposited: 0,
    nextTier: null,
    progressToNext: 0,
    joinDate: null,
    bonusesEarned: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVipStatus = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/vip/status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch VIP status');
      }
      
      const data = await response.json();
      
      // Calculate VIP status based on deposits
      const totalDeposited = data.totalDeposited || 0;
      const currentTier = VIP_TIERS.find(tier => totalDeposited >= tier.minDeposit) || null;
      const nextTier = VIP_TIERS.find(tier => tier.minDeposit > totalDeposited) || null;
      
      let progressToNext = 0;
      if (nextTier) {
        const previousTierDeposit = currentTier?.minDeposit || 0;
        const neededForNext = nextTier.minDeposit - previousTierDeposit;
        const currentProgress = totalDeposited - previousTierDeposit;
        progressToNext = Math.min((currentProgress / neededForNext) * 100, 100);
      }
      
      setVipStatus({
        isVip: currentTier !== null,
        currentTier,
        totalDeposited,
        nextTier,
        progressToNext,
        joinDate: data.joinDate || (currentTier ? new Date().toISOString() : null),
        bonusesEarned: data.bonusesEarned || 0
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VIP status');
      console.error('VIP status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVipStatus();
  }, [user]);

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please sign in to view VIP status</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">Loading VIP status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
        <Crown className="w-5 h-5" />
        <span>VIP Program</span>
      </h3>

      {/* Current VIP Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-lg border-2 ${
          vipStatus.isVip 
            ? 'border-yellow-500/50 bg-yellow-500/10' 
            : 'border-gray-600/50 bg-gray-800/50'
        }`}
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{
              scale: vipStatus.isVip ? [1, 1.1, 1] : 1,
              rotate: vipStatus.isVip ? [0, 5, -5, 0] : 0
            }}
            transition={{
              duration: 3,
              repeat: vipStatus.isVip ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            {vipStatus.currentTier?.icon || '👑'}
          </motion.div>
          
          <h4 className="text-xl font-bold text-white mb-2">
            {vipStatus.isVip 
              ? `VIP ${vipStatus.currentTier?.name}` 
              : 'Not VIP Yet'
            }
          </h4>
          
          <p className="text-gray-400 text-sm">
            {vipStatus.isVip 
              ? 'Enjoy exclusive VIP benefits!'
              : 'Deposit ◎25 or more to unlock VIP status'
            }
          </p>
        </div>

        {/* Progress to Next Tier */}
        {vipStatus.nextTier && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-400">
                Progress to {vipStatus.nextTier.name}
              </span>
              <span className="text-sm font-bold text-white">
                {formatCurrency(vipStatus.totalDeposited)} / {formatCurrency(vipStatus.nextTier.minDeposit)}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-cyan-500 to-purple-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${vipStatus.progressToNext}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {formatCurrency(vipStatus.nextTier.minDeposit - vipStatus.totalDeposited)} needed
            </div>
          </div>
        )}

        {/* VIP Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-400">Total Deposited</div>
            <div className="text-lg font-bold text-white">
              {formatCurrency(vipStatus.totalDeposited)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-400">VIP Bonuses</div>
            <div className="text-lg font-bold text-yellow-400">
              {formatCurrency(vipStatus.bonusesEarned)}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Current Tier Benefits */}
      {vipStatus.currentTier && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <h4 className="text-md font-bold text-white mb-3 flex items-center space-x-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span>Your {vipStatus.currentTier.name} Benefits</span>
          </h4>
          <div className="space-y-2">
            {vipStatus.currentTier.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-gray-300">{benefit}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* VIP Tiers Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-3"
      >
        <h4 className="text-md font-bold text-white">VIP Tiers</h4>
        {VIP_TIERS.map((tier, index) => (
          <motion.div
            key={tier.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`p-3 rounded-lg border transition-all ${
              vipStatus.currentTier?.id === tier.id
                ? 'border-yellow-500/50 bg-yellow-500/10'
                : vipStatus.totalDeposited >= tier.minDeposit
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-gray-600/30 bg-gray-800/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{tier.icon}</span>
                <div>
                  <div className={`font-bold ${tier.color}`}>{tier.name} VIP</div>
                  <div className="text-xs text-gray-400">
                    Min deposit: {formatCurrency(tier.minDeposit)}
                  </div>
                </div>
              </div>
              
              {vipStatus.currentTier?.id === tier.id && (
                <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 font-bold">
                  CURRENT
                </div>
              )}
              
              {vipStatus.totalDeposited >= tier.minDeposit && vipStatus.currentTier?.id !== tier.id && (
                <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded text-xs text-green-400 font-bold">
                  UNLOCKED
                </div>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-400">
              Key benefit: {tier.benefits[tier.benefits.length - 1]}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Join Date */}
      {vipStatus.joinDate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">VIP Since</span>
          </div>
          <div className="text-white">
            {new Date(vipStatus.joinDate).toLocaleDateString()}
          </div>
        </motion.div>
      )}

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
