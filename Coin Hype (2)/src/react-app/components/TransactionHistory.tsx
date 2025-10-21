import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, ArrowUpRight, ArrowDownLeft, Gamepad2, Trophy, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface Transaction {
  id: number;
  transaction_type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  amount_sol: number;
  status: 'pending' | 'confirmed' | 'failed';
  game_session_id?: string;
  created_at: string;
  transaction_signature?: string;
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await fetch('/api/transactions', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
      console.error('Transaction fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const getTransactionIcon = (type: Transaction['transaction_type']) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-green-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-red-400" />;
      case 'bet':
        return <Gamepad2 className="w-4 h-4 text-orange-400" />;
      case 'win':
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: Transaction['transaction_type'], amount: number) => {
    if (type === 'deposit' || type === 'win') return 'text-green-400';
    if (type === 'withdrawal' || type === 'bet') return 'text-red-400';
    return amount > 0 ? 'text-green-400' : 'text-red-400';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const colors = {
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded border ${colors[status]} capitalize`}>
        {status}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <p>Please sign in to view transaction history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <History className="w-5 h-5" />
          <span>Transaction History</span>
        </h3>
        <button
          onClick={fetchTransactions}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-6 h-6 animate-spin text-cyan-400" />
          <span className="ml-2 text-gray-400">Loading transactions...</span>
        </div>
      )}

      {error && (
        <div className="text-center text-red-400 py-8">
          <p>{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-2 text-sm text-cyan-400 hover:text-cyan-300 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && transactions.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No transactions yet</p>
          <p className="text-sm mt-1">Start playing to see your transaction history</p>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg bg-gray-800/50 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getTransactionIcon(tx.transaction_type)}
                  <div>
                    <div className="text-white font-medium capitalize">
                      {tx.transaction_type}
                    </div>
                    <div className="text-xs text-gray-400">
                      {formatDate(tx.created_at)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getTransactionColor(tx.transaction_type, tx.amount_sol)}`}>
                    {tx.amount_sol > 0 ? '+' : ''}◎{Math.abs(tx.amount_sol).toFixed(4)}
                  </div>
                  {getStatusBadge(tx.status)}
                </div>
              </div>
              
              {tx.game_session_id && (
                <div className="text-xs text-gray-500 mt-1">
                  Game Session: {tx.game_session_id.slice(0, 8)}...
                </div>
              )}
              
              {tx.transaction_signature && (
                <div className="text-xs text-gray-500 mt-1">
                  Tx: {tx.transaction_signature.slice(0, 12)}...
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
