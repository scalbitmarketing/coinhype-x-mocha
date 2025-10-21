import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import Logo from './Logo';

interface GameAction {
  text: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

interface UniversalGameTemplateProps {
  children: React.ReactNode;
  actions: GameAction[];
  customBetInput?: React.ReactNode;
  showBetControls?: boolean;
  backgroundColor?: string;
  gameStats?: Array<{
    label: string;
    value: string;
    color?: string;
    icon?: React.ReactNode;
  }>;
}

export default function UniversalGameTemplate({
  children,
  actions,
  customBetInput,
  showBetControls = true,
  backgroundColor = 'from-purple-900/20 via-blue-900/20 to-cyan-900/20',
  gameStats = []
}: UniversalGameTemplateProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { balance: solanaBalance } = useSolana();
  const { balance: demoBalance, currentBet, setBet } = useGameStore();
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  const isRealMode = user && solanaBalance;
  const currentBalance = isRealMode ? solanaBalance.balanceSol : demoBalance;

  // Prevent pull-to-refresh and scrolling during gameplay
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    const preventPullToRefresh = (e: TouchEvent) => {
      if (e.touches.length === 1 && e.touches[0].clientY > 100) {
        e.preventDefault();
      }
    };

    // Add event listeners to prevent scrolling
    container.addEventListener('touchmove', preventScroll, { passive: false });
    container.addEventListener('touchstart', preventPullToRefresh, { passive: false });
    
    // Add no-scroll class to body
    document.body.classList.add('overflow-hidden');

    return () => {
      container.removeEventListener('touchmove', preventScroll);
      container.removeEventListener('touchstart', preventPullToRefresh);
      document.body.classList.remove('overflow-hidden');
    };
  }, []);

  const formatBalance = (balance: number): string => {
    if (balance >= 1000000) return `${(balance / 1000000).toFixed(1)}M`;
    if (balance >= 1000) return `${(balance / 1000).toFixed(1)}K`;
    return balance.toFixed(2);
  };

  const updateBet = (newBet: number) => {
    const clampedBet = Math.max(0.01, Math.min(newBet, currentBalance));
    setBet(clampedBet);
  };

  const getButtonVariant = (variant: string) => {
    switch (variant) {
      case 'danger':
        return 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
      case 'secondary':
        return 'bg-white/10 hover:bg-white/20 border border-white/20';
      default:
        return 'btn-primary';
    }
  };

  return (
    <div 
      ref={gameContainerRef} 
      className="fixed inset-0 bg-gray-900 text-white overflow-hidden"
      style={{
        height: '100dvh', // Dynamic viewport height for mobile
      }}
    >
      {/* Fixed Header with Logo Priority */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center justify-between p-3 h-16 max-w-md mx-auto">
          {/* Left: Back Button (Small) */}
          <button
            onClick={() => navigate('/lobby')}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex-shrink-0"
            aria-label="Back to lobby"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          
          {/* Center: Logo (Priority) */}
          <div className="flex-1 flex justify-center px-2">
            <Logo size="small" />
          </div>
          
          {/* Right: Balance (Compact) */}
          <div className="flex-shrink-0">
            <div className="glass-panel px-2 py-1 rounded-lg">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  ◎ {formatBalance(currentBalance)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Game Stats - Only show if provided */}
      {gameStats.length > 0 && (
        <div className="fixed top-16 left-0 right-0 z-40 px-3 py-2 bg-gray-900/70 backdrop-blur-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-md mx-auto">
            {gameStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-panel p-2 text-center"
              >
                <div className="flex items-center justify-center space-x-1 mb-1">
                  {stat.icon}
                  <span className="text-xs text-white/70">{stat.label}</span>
                </div>
                <div className={`text-xs font-bold ${stat.color || 'text-white'}`}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Game Canvas - Maximum space for game content */}
      <main 
        className="flex-1 relative overflow-hidden" 
        style={{ 
          height: 'calc(100dvh - 140px)',
          paddingTop: gameStats.length > 0 ? '108px' : '64px', // Account for header + stats
          paddingBottom: '76px' // Account for controls
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${backgroundColor} opacity-30`} />
        
        {/* Game Content - Optimized for iPhone screens */}
        <div className="h-full flex items-center justify-center p-3 overflow-y-auto">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Fixed Controls - Compact but accessible */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/90 backdrop-blur-sm border-t border-white/10 p-3">
        <div className="max-w-md mx-auto space-y-3">
          {/* Bet Controls */}
          {showBetControls && (
            <div className="flex items-center space-x-2">
              {customBetInput || (
                <>
                  <div className="flex-1">
                    <div className="relative">
                      <input
                        type="number"
                        value={currentBet}
                        onChange={(e) => updateBet(Number(e.target.value))}
                        min="0.01"
                        max={currentBalance}
                        step="0.01"
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 pr-10 text-sm h-10"
                        placeholder="0.01"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/50">
                        ◎
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button
                      onClick={() => updateBet(currentBet / 2)}
                      className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-8 h-10"
                    >
                      ½
                    </button>
                    <button
                      onClick={() => updateBet(Math.min(currentBet * 2, currentBalance))}
                      className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-9 h-10"
                    >
                      2×
                    </button>
                    <button
                      onClick={() => updateBet(currentBalance)}
                      className="px-2 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-semibold text-white transition-colors w-10 h-10"
                    >
                      Max
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {actions.map((action, index) => (
              <motion.button
                key={index}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`w-full h-12 font-bold rounded-lg relative transition-all text-sm ${getButtonVariant(action.variant || 'primary')} ${
                  action.disabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
                whileTap={!action.disabled ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                {action.loading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                <span className={action.loading ? 'opacity-0' : 'opacity-100'}>
                  {action.text}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
