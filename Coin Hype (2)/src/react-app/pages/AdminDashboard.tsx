import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Upload, Users, TrendingUp, DollarSign, Activity, Download, FileText } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import DataUploadModal from '@/react-app/components/DataUploadModal';
import MobileGameHeader from '@/react-app/components/MobileGameHeader';

interface DatabaseStats {
  totalUsers: number;
  totalTransactions: number;
  totalGameSessions: number;
  totalVolume: number;
  recentUploads: UploadHistory[];
}

interface UploadHistory {
  id: string;
  dataType: string;
  filename: string;
  recordsProcessed: number;
  uploadedAt: string;
  uploadedBy: string;
  status: 'success' | 'failed' | 'processing';
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/create-account');
      return;
    }
    
    fetchDashboardStats();
  }, [user, navigate]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/dashboard-stats', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = async (dataType: string) => {
    try {
      const response = await fetch(`/api/admin/export-data?type=${dataType}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${dataType}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <MobileGameHeader 
        title="Admin Dashboard" 
        icon={Database}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Database Administration</h1>
              <p className="text-gray-400">Manage and upload data to your casino database</p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="neon-button flex items-center space-x-2 px-6 py-3"
            >
              <Upload className="w-5 h-5" />
              <span>Upload Data</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-panel p-6 animate-pulse">
                <div className="h-12 bg-white/10 rounded mb-4"></div>
                <div className="h-6 bg-white/10 rounded mb-2"></div>
                <div className="h-4 bg-white/10 rounded"></div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-medium">Total Users</h3>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Registered accounts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-white font-medium">Transactions</h3>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalTransactions.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">All time transactions</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-white font-medium">Game Sessions</h3>
              </div>
              <p className="text-2xl font-bold text-white">{stats.totalGameSessions.toLocaleString()}</p>
              <p className="text-gray-400 text-sm">Games played</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-panel p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-white font-medium">Total Volume</h3>
              </div>
              <p className="text-2xl font-bold text-white">◎{stats.totalVolume.toFixed(2)}</p>
              <p className="text-gray-400 text-sm">All time volume</p>
            </motion.div>
          </div>
        ) : null}

        {/* Data Export Section */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Export Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { type: 'users', label: 'Users', description: 'Export all user data' },
              { type: 'transactions', label: 'Transactions', description: 'Export transaction history' },
              { type: 'game_sessions', label: 'Game Sessions', description: 'Export game session data' },
              { type: 'balances', label: 'Balances', description: 'Export user balances' },
              { type: 'referrals', label: 'Referrals', description: 'Export referral data' },
              { type: 'leaderboard', label: 'Leaderboard', description: 'Export leaderboard data' }
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => exportData(item.type)}
                className="p-4 border border-white/20 rounded-lg hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all text-left group"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <Download className="w-5 h-5 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                  <span className="text-white font-medium">{item.label}</span>
                </div>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Uploads */}
        {stats && stats.recentUploads.length > 0 && (
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold text-white mb-4">Recent Uploads</h2>
            <div className="space-y-3">
              {stats.recentUploads.map((upload) => (
                <div key={upload.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      upload.status === 'success' ? 'bg-green-500/20' :
                      upload.status === 'failed' ? 'bg-red-500/20' : 'bg-yellow-500/20'
                    }`}>
                      <FileText className={`w-5 h-5 ${
                        upload.status === 'success' ? 'text-green-400' :
                        upload.status === 'failed' ? 'text-red-400' : 'text-yellow-400'
                      }`} />
                    </div>
                    <div>
                      <p className="text-white font-medium">{upload.filename}</p>
                      <p className="text-gray-400 text-sm">
                        {upload.dataType} • {upload.recordsProcessed} records • {new Date(upload.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    upload.status === 'success' ? 'bg-green-500/20 text-green-400' :
                    upload.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {upload.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage Guidelines */}
        <div className="glass-panel p-6">
          <h2 className="text-xl font-bold text-white mb-4">Upload Guidelines</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-white font-medium mb-3">Supported Formats</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• CSV files with headers</li>
                <li>• JSON files with array of objects</li>
                <li>• Maximum file size: 10MB</li>
                <li>• UTF-8 encoding recommended</li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-medium mb-3">Best Practices</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Download templates before uploading</li>
                <li>• Validate data before upload</li>
                <li>• Backup existing data first</li>
                <li>• Test with small files initially</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <DataUploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
      />
    </div>
  );
};

export default AdminDashboard;
