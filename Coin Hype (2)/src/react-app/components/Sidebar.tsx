import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  User, 
  Gift, 
  Trophy, 
  Crown, 
  HelpCircle, 
  History, 
  TrendingUp,
  LogIn,
  LogOut,
  Database
} from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useNavigate } from 'react-router';
import Logo from './Logo';
import TransactionHistory from './TransactionHistory';
import AccountPnL from './AccountPnL';
import Leaderboard from './Leaderboard';
import DailyBonus from './DailyBonus';
import VipProgram from './VipProgram';
import HowToPlay from './HowToPlay';
import AffiliateProgram from './AffiliateProgram';
import TipUsers from './TipUsers';
import Rakeback from './Rakeback';
import ReferralSystem from './ReferralSystem';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'GET',
        credentials: 'include',
      });
      logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onToggle(); // Close sidebar when navigating to a new page
  };

  const menuItems = [
    { id: 'home', label: 'Home', icon: Home, action: () => { handleNavigate('/'); setActiveSection(null); }, isNavigation: true },
    { id: 'games', label: 'Games', icon: Trophy, action: () => { handleNavigate('/lobby'); setActiveSection(null); }, isNavigation: true },
    { id: 'sports', label: 'Sports', icon: TrendingUp, action: () => { handleNavigate('/sports'); setActiveSection(null); }, isNavigation: true },
    { id: 'account', label: 'Account', icon: User, action: () => setActiveSection('account'), isNavigation: false },
    { id: 'transactions', label: 'History', icon: History, action: () => setActiveSection('transactions'), isNavigation: false },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, action: () => setActiveSection('leaderboard'), isNavigation: false },
    { id: 'daily-bonus', label: 'Daily Bonus', icon: Gift, action: () => setActiveSection('daily-bonus'), isNavigation: false },
    { id: 'vip', label: 'VIP Program', icon: Crown, action: () => setActiveSection('vip'), isNavigation: false },
    { id: 'referrals', label: 'Referrals', icon: User, action: () => setActiveSection('referrals'), isNavigation: false },
    { id: 'admin', label: 'Admin', icon: Database, action: () => { handleNavigate('/admin'); setActiveSection(null); }, isNavigation: true },
    { id: 'help', label: 'Help', icon: HelpCircle, action: () => setActiveSection('help'), isNavigation: false },
  ];

  return (
    <>
      {/* Menu Toggle Button - Available on both mobile and desktop */}
      <button
        onClick={onToggle}
        className="fixed top-3 left-3 z-[60] p-3 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-white/20 text-white hover:bg-gray-800/95 transition-all duration-200 shadow-lg hover:shadow-xl"
        title={isOpen ? "Close Menu" : "Open Menu"}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile and desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[50]"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen ? 0 : -300 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed left-0 top-0 h-full w-80 bg-gray-900/95 backdrop-blur-xl border-r border-white/10 z-[51] overflow-y-auto shadow-2xl"
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Logo size="large" />
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={item.action}
                whileHover={{ x: 4 }}
                className="w-full flex items-center space-x-3 p-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-colors text-left"
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </motion.button>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="mt-8 pt-6 border-t border-white/10">
            {user ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {user.email}
                    </p>
                    <p className="text-gray-400 text-xs">Online</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNavigate('/create-account')}
                className="w-full flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white hover:from-cyan-700 hover:to-purple-700 transition-colors"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-medium">Login / Sign Up</span>
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Content for active sections - Same side as sidebar */}
      <AnimatePresence>
        {activeSection && isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 80 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed left-0 top-0 h-full w-80 bg-gray-800/95 backdrop-blur-xl border-l border-white/10 z-[52] overflow-y-auto ml-80"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white capitalize">
                  {activeSection.replace('-', ' ')}
                </h2>
                <button
                  onClick={() => setActiveSection(null)}
                  className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Section Content */}
              <div className="space-y-4">
                {activeSection === 'account' && (
                  <AccountPnL />
                )}
                {activeSection === 'transactions' && (
                  <TransactionHistory />
                )}
                {activeSection === 'leaderboard' && (
                  <Leaderboard />
                )}
                {activeSection === 'daily-bonus' && (
                  <DailyBonus />
                )}
                {activeSection === 'vip' && (
                  <VipProgram />
                )}
                {activeSection === 'affiliates' && (
                  <AffiliateProgram />
                )}
                {activeSection === 'tip-users' && (
                  <TipUsers />
                )}
                {activeSection === 'rakeback' && (
                  <Rakeback />
                )}
                {activeSection === 'referrals' && (
                  <ReferralSystem />
                )}
                {activeSection === 'help' && (
                  <HowToPlay />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
