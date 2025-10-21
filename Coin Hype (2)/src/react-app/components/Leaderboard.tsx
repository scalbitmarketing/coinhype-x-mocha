import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp, TrendingDown, Crown, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface LeaderboardEntry {
  userId: string;
  email: string;
  totalWagered: number;
  totalWon: number;
  netPnL: number;
  gamesPlayed: number;
  winRate: number;
  rank: number;
}

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leaderboard?timeframe=${timeframe}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data.leaderboard || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      console.error('Leaderboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-orange-400" />;
      default:
        return <span className="w-5 h-5 flex items-center justify-center text-gray-400 text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    if (rank === 2) return 'bg-gray-500/20 border-gray-500/30 text-gray-300';
    if (rank === 3) return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
    return 'bg-gray-700/50 border-gray-600/30 text-gray-300';
  };

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getCurrentUserRank = () => {
    if (!user) return null;
    return leaderboard.find(entry => entry.userId === user.id);
  };

  const currentUserEntry = getCurrentUserRank();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Leaderboard</span>
        </h3>
        <button
          onClick={fetchLeaderboard}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Timeframe Selection */}
      <div className="flex space-x-2">
        {(['all', 'month', 'week'] as const).map((period) => (
          <button
            key={period}
            onClick={() => setTimeframe(period)}
            className={`px-3 py-1 text-sm rounded-lg transition-colors capitalize ${
              timeframe === period
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-gray-700/50 text-gray-400 hover:text-gray-300 border border-gray-600/30'
            }`}
          >
            {period === 'all' ? 'All Time' : `This ${period}`}
          </button>
        ))}
      </div>

      {/* Current User Rank */}
      {currentUserEntry && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getRankIcon(currentUserEntry.rank)}
              <div>
                <div className="text-white font-medium">Your Rank</div>
                <div className="text-xs text-gray-400">#{currentUserEntry.rank} of {leaderboard.length}</div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-bold ${currentUserEntry.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(currentUserEntry.netPnL)}
              </div>
              <div className="text-xs text-gray-400">Net P&L</div>
            </div>
          </div>
        </motion.div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-gray-400">Loading leaderboard...</span>
        </div>
      )}

      {error && (
        <div className="text-center text-red-400 py-8">
          <p>{error}</p>
          <button
            onClick={fetchLeaderboard}
            className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && leaderboard.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No players on the leaderboard yet</p>
          <p className="text-sm mt-1">Be the first to start playing!</p>
        </div>
      )}

      {!loading && !error && leaderboard.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {leaderboard.slice(0, 50).map((entry, index) => (
            <motion.div
              key={entry.userId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-lg border transition-colors ${
                entry.userId === user?.id 
                  ? 'bg-cyan-500/10 border-cyan-500/30' 
                  : 'bg-gray-800/50 border-white/10 hover:border-white/20'
              } ${getRankBadge(entry.rank)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getRankIcon(entry.rank)}
                  <div>
                    <div className="text-white font-medium">
                      {entry.email.split('@')[0]}
                      {entry.userId === user?.id && <span className="text-cyan-400 ml-1">(You)</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {entry.gamesPlayed} games • {formatPercentage(entry.winRate)} win rate
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold flex items-center space-x-1 ${
                    entry.netPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.netPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{formatCurrency(entry.netPnL)}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    Wagered: {formatCurrency(entry.totalWagered)}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Leaderboard Stats */}
      {!loading && leaderboard.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
        >
          <h4 className="text-md font-bold text-white mb-3">Leaderboard Stats</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Players</div>
              <div className="text-white font-bold">{leaderboard.length}</div>
            </div>
            <div>
              <div className="text-gray-400">Top Player</div>
              <div className="text-yellow-400 font-bold">
                {leaderboard[0]?.email.split('@')[0] || 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Highest P&L</div>
              <div className="text-green-400 font-bold">
                {leaderboard[0] ? formatCurrency(leaderboard[0].netPnL) : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Total Volume</div>
              <div className="text-cyan-400 font-bold">
                {formatCurrency(leaderboard.reduce((sum, entry) => sum + entry.totalWagered, 0))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
