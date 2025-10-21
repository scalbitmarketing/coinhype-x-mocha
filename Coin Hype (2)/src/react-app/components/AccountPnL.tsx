import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Gamepad2, Trophy, Target, RefreshCw, Loader } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';

interface PnLData {
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
  netPnL: number;
  currentBalance: number;
  winRate: number;
  totalGames: number;
}

export default function AccountPnL() {
  const { user } = useAuth();
  const { balance } = useSolana();
  const [pnlData, setPnlData] = useState<PnLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPnLData = async () => {
    if (!user || !balance) return;
    
    try {
      setLoading(true);
      
      // Fetch user balance which includes PnL data
      const response = await fetch('/api/balance', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch balance data');
      }
      
      const data = await response.json();
      
      // Calculate PnL metrics
      const netPnL = (data.totalWon || 0) - (data.totalWagered || 0);
      const winRate = data.totalWagered > 0 ? ((data.totalWon || 0) / (data.totalWagered || 0)) * 100 : 0;
      
      // Fetch game sessions count
      const gamesResponse = await fetch('/api/transactions?type=bet', {
        credentials: 'include',
      });
      
      let totalGames = 0;
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json();
        totalGames = gamesData.transactions?.filter((tx: any) => tx.transaction_type === 'bet').length || 0;
      }
      
      setPnlData({
        totalDeposited: data.totalDeposited || 0,
        totalWithdrawn: data.totalWithdrawn || 0,
        totalWagered: data.totalWagered || 0,
        totalWon: data.totalWon || 0,
        netPnL,
        currentBalance: data.balanceSol || 0,
        winRate,
        totalGames
      });
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PnL data');
      console.error('PnL fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPnLData();
  }, [user, balance]);

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Please sign in to view account P&L</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-400" />
        <span className="ml-2 text-gray-400">Loading P&L data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-8">
        <p>{error}</p>
        <button
          onClick={fetchPnLData}
          className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!pnlData) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>No P&L data available</p>
      </div>
    );
  }

  const pnlCards = [
    {
      title: 'Net P&L',
      value: formatCurrency(pnlData.netPnL),
      icon: pnlData.netPnL >= 0 ? TrendingUp : TrendingDown,
      color: pnlData.netPnL >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: pnlData.netPnL >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
    },
    {
      title: 'Current Balance',
      value: formatCurrency(pnlData.currentBalance),
      icon: DollarSign,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/30'
    },
    {
      title: 'Total Wagered',
      value: formatCurrency(pnlData.totalWagered),
      icon: Gamepad2,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30'
    },
    {
      title: 'Total Won',
      value: formatCurrency(pnlData.totalWon),
      icon: Trophy,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30'
    }
  ];

  const statsCards = [
    {
      title: 'Win Rate',
      value: formatPercentage(pnlData.winRate),
      subtitle: 'Wins vs Total Wagered'
    },
    {
      title: 'Total Games',
      value: pnlData.totalGames.toString(),
      subtitle: 'Games Played'
    },
    {
      title: 'Total Deposited',
      value: formatCurrency(pnlData.totalDeposited),
      subtitle: 'All Time Deposits'
    },
    {
      title: 'Total Withdrawn',
      value: formatCurrency(pnlData.totalWithdrawn),
      subtitle: 'All Time Withdrawals'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Account P&L</span>
        </h3>
        <button
          onClick={fetchPnLData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main P&L Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pnlCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-lg border ${card.bgColor}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <card.icon className={`w-5 h-5 ${card.color}`} />
                <span className="text-gray-400 text-sm">{card.title}</span>
              </div>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            className="p-4 rounded-lg bg-gray-800/50 border border-white/10"
          >
            <div className="text-gray-400 text-sm mb-1">{card.title}</div>
            <div className="text-lg font-bold text-white mb-1">{card.value}</div>
            <div className="text-xs text-gray-500">{card.subtitle}</div>
          </motion.div>
        ))}
      </div>

      {/* P&L Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-4 rounded-lg bg-gray-800/30 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-3">P&L Summary</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>
            • You have {pnlData.netPnL >= 0 ? 'gained' : 'lost'} {' '}
            <span className={pnlData.netPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrency(Math.abs(pnlData.netPnL))}
            </span> from gaming
          </p>
          <p>
            • Your win rate is <span className="text-cyan-400">{formatPercentage(pnlData.winRate)}</span> of total wagered
          </p>
          <p>
            • You've played <span className="text-yellow-400">{pnlData.totalGames}</span> games total
          </p>
          <p>
            • Net deposits: <span className="text-purple-400">
              {formatCurrency(pnlData.totalDeposited - pnlData.totalWithdrawn)}
            </span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
