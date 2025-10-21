import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, Clock, CheckCircle, DollarSign, Calendar, Loader } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface DailyBonusState {
  canClaim: boolean;
  lastClaimed: string | null;
  timeUntilNext: number;
  bonusAmount: number;
  streak: number;
  totalClaimed: number;
}

export default function DailyBonus() {
  const { user } = useAuth();
  const [bonusState, setBonusState] = useState<DailyBonusState>({
    canClaim: false,
    lastClaimed: null,
    timeUntilNext: 0,
    bonusAmount: 1.0, // $1 equivalent in SOL
    streak: 0,
    totalClaimed: 0
  });
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBonusState = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/daily-bonus/status', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch bonus status');
      }
      
      const data = await response.json();
      setBonusState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bonus status');
      console.error('Daily bonus fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    if (!user || !bonusState.canClaim || claiming) return;
    
    try {
      setClaiming(true);
      const response = await fetch('/api/daily-bonus/claim', {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to claim bonus');
      }
      
      const data = await response.json();
      setBonusState(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to claim bonus');
      console.error('Daily bonus claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  useEffect(() => {
    fetchBonusState();
    
    // Update countdown every second
    const interval = setInterval(() => {
      setBonusState(prev => ({
        ...prev,
        timeUntilNext: Math.max(0, prev.timeUntilNext - 1)
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  const formatTimeRemaining = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please sign in to claim daily bonus</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">Loading bonus status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center space-x-2">
        <Gift className="w-5 h-5" />
        <span>Daily Bonus</span>
      </h3>

      {/* Main Bonus Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-lg border-2 ${
          bonusState.canClaim 
            ? 'border-green-500/50 bg-green-500/10' 
            : 'border-gray-600/50 bg-gray-800/50'
        }`}
      >
        <div className="text-center mb-6">
          <motion.div
            animate={{
              scale: bonusState.canClaim ? [1, 1.1, 1] : 1,
              rotate: bonusState.canClaim ? [0, 5, -5, 0] : 0
            }}
            transition={{
              duration: 2,
              repeat: bonusState.canClaim ? Infinity : 0,
              ease: "easeInOut"
            }}
            className="text-6xl mb-4"
          >
            🎁
          </motion.div>
          
          <h4 className="text-xl font-bold text-white mb-2">Daily Free Dollar</h4>
          <p className="text-gray-400 text-sm">
            Claim your free daily bonus - ◎{bonusState.bonusAmount.toFixed(4)} every 24 hours!
          </p>
        </div>

        {bonusState.canClaim ? (
          <motion.button
            onClick={claimBonus}
            disabled={claiming}
            className="w-full p-4 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold text-lg transition-all disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {claiming ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader className="w-5 h-5 animate-spin" />
                <span>Claiming...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <Gift className="w-5 h-5" />
                <span>Claim ◎{bonusState.bonusAmount.toFixed(4)}</span>
              </div>
            )}
          </motion.button>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <span className="text-orange-400 font-bold">
                {bonusState.timeUntilNext > 0 ? formatTimeRemaining(bonusState.timeUntilNext) : 'Ready!'}
              </span>
            </div>
            <button
              disabled
              className="w-full p-4 rounded-lg bg-gray-600 text-gray-400 font-bold text-lg cursor-not-allowed"
            >
              Bonus Claimed Today
            </button>
          </div>
        )}
      </motion.div>

      {/* Bonus Stats */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-gray-400 text-sm">Current Streak</span>
          </div>
          <div className="text-xl font-bold text-white">{bonusState.streak} days</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span className="text-gray-400 text-sm">Total Claimed</span>
          </div>
          <div className="text-xl font-bold text-white">
            ◎{bonusState.totalClaimed.toFixed(4)}
          </div>
        </motion.div>
      </div>

      {/* Last Claimed Info */}
      {bonusState.lastClaimed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400 text-sm">Last Claimed</span>
          </div>
          <div className="text-white">
            {new Date(bonusState.lastClaimed).toLocaleString()}
          </div>
        </motion.div>
      )}

      {/* Bonus Rules */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">Bonus Rules</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• Claim once every 24 hours</p>
          <p>• Must have an active account</p>
          <p>• Bonus is added directly to your balance</p>
          <p>• No wagering requirements</p>
          <p>• Streak resets if you miss a day</p>
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
