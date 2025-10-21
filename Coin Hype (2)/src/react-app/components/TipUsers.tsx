import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Send, Gift, Search, Loader, RefreshCw } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';

interface User {
  id: string;
  email: string;
  isOnline: boolean;
  lastSeen: string;
}

interface TipHistory {
  id: string;
  recipientEmail: string;
  amount: number;
  message: string;
  timestamp: string;
  type: 'sent' | 'received';
}

export default function TipUsers() {
  const { user } = useAuth();
  const { balance } = useSolana();
  const [users, setUsers] = useState<User[]>([]);
  const [tipHistory, setTipHistory] = useState<TipHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [tipAmount, setTipAmount] = useState('');
  const [tipMessage, setTipMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateMockUsers = (): User[] => {
    const mockEmails = [
      'player1@example.com', 'gamer2@example.com', 'crypto3@example.com',
      'winner4@example.com', 'lucky5@example.com', 'slots6@example.com',
      'dice7@example.com', 'crash8@example.com', 'mines9@example.com'
    ];
    
    return mockEmails.map(email => ({
      id: Math.random().toString(36).substr(2, 9),
      email,
      isOnline: Math.random() > 0.5,
      lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }));
  };

  const generateMockHistory = (): TipHistory[] => {
    const mockHistory: TipHistory[] = [];
    for (let i = 0; i < 5; i++) {
      mockHistory.push({
        id: Math.random().toString(36).substr(2, 9),
        recipientEmail: `player${i + 1}@example.com`,
        amount: Math.random() * 1,
        message: ['Good luck!', 'Nice win!', 'Thanks for the game!', 'Keep it up!'][Math.floor(Math.random() * 4)],
        timestamp: new Date(Date.now() - Math.random() * 604800000).toISOString(),
        type: Math.random() > 0.5 ? 'sent' : 'received'
      });
    }
    return mockHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app, fetch from API
      setUsers(generateMockUsers());
      setTipHistory(generateMockHistory());
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sendTip = async () => {
    if (!selectedUser || !tipAmount || !user) return;
    
    const amount = parseFloat(tipAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid tip amount');
      return;
    }

    const currentBalance = balance?.balanceSol || 0;
    if (amount > currentBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      // Mock API call - in real app, send to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to history
      const newTip: TipHistory = {
        id: Math.random().toString(36).substr(2, 9),
        recipientEmail: selectedUser.email,
        amount,
        message: tipMessage || 'Good luck!',
        timestamp: new Date().toISOString(),
        type: 'sent'
      };
      
      setTipHistory(prev => [newTip, ...prev]);
      setSuccess(`Successfully sent ◎${amount.toFixed(4)} to ${selectedUser.email}`);
      
      // Reset form
      setSelectedUser(null);
      setTipAmount('');
      setTipMessage('');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send tip');
    } finally {
      setSending(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `◎${value.toFixed(4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="text-center text-gray-400 py-8">
        <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Please sign in to tip other users</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Heart className="w-5 h-5" />
          <span>Tip Users</span>
        </h3>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Current Balance */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400 font-bold">Available to Tip</span>
          </div>
          <div className="text-xl font-bold text-white">
            {balance ? formatCurrency(balance.balanceSol) : '◎0.0000'}
          </div>
        </div>
      </motion.div>

      {/* Send Tip Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-lg bg-gray-800/50 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-4">Send a Tip</h4>
        
        {/* User Search */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Search Users</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by email..."
              className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader className="w-4 h-4 animate-spin text-cyan-400" />
            <span className="ml-2 text-gray-400 text-sm">Loading users...</span>
          </div>
        ) : (
          <div className="mb-4 max-h-32 overflow-y-auto">
            {filteredUsers.map(user => (
              <motion.button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full p-3 rounded-lg text-left transition-colors mb-2 ${
                  selectedUser?.id === user.id
                    ? 'bg-cyan-500/20 border border-cyan-500/30'
                    : 'bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/30'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="text-white text-sm">{user.email}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {user.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* Selected User */}
        {selectedUser && (
          <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <div className="text-sm text-cyan-400">Sending tip to:</div>
            <div className="text-white font-bold">{selectedUser.email}</div>
          </div>
        )}

        {/* Tip Amount */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Tip Amount (SOL)</div>
          <input
            type="number"
            value={tipAmount}
            onChange={(e) => setTipAmount(e.target.value)}
            placeholder="0.0000"
            step="0.0001"
            min="0.0001"
            max={balance?.balanceSol || 0}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Tip Message */}
        <div className="mb-4">
          <div className="text-sm text-gray-400 mb-2">Message (Optional)</div>
          <input
            type="text"
            value={tipMessage}
            onChange={(e) => setTipMessage(e.target.value)}
            placeholder="Good luck!"
            maxLength={100}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        {/* Send Button */}
        <button
          onClick={sendTip}
          disabled={!selectedUser || !tipAmount || sending}
          className="w-full p-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-bold transition-colors disabled:cursor-not-allowed"
        >
          {sending ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Send Tip</span>
            </div>
          )}
        </button>
      </motion.div>

      {/* Tip History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-6 rounded-lg bg-gray-800/50 border border-white/10"
      >
        <h4 className="text-md font-bold text-white mb-4">Recent Tips</h4>
        
        {tipHistory.length === 0 ? (
          <div className="text-center text-gray-400 py-4">
            <Heart className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tips yet</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tipHistory.map(tip => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-lg border ${
                  tip.type === 'sent' 
                    ? 'border-red-500/30 bg-red-500/10' 
                    : 'border-green-500/30 bg-green-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      tip.type === 'sent' ? 'bg-red-400' : 'bg-green-400'
                    }`} />
                    <span className="text-white text-sm font-medium">
                      {tip.type === 'sent' ? 'Sent to' : 'Received from'} {tip.recipientEmail}
                    </span>
                  </div>
                  <span className={`text-sm font-bold ${
                    tip.type === 'sent' ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {tip.type === 'sent' ? '-' : '+'}{formatCurrency(tip.amount)}
                  </span>
                </div>
                <div className="text-xs text-gray-400">"{tip.message}"</div>
                <div className="text-xs text-gray-500 mt-1">{formatDate(tip.timestamp)}</div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Success/Error Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400"
        >
          {success}
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
