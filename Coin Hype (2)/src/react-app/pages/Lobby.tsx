import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router';
import { Dices, TrendingUp, Bomb, Zap, Cherry, RotateCcw, Spade, Crown, DollarSign, Trophy, Calendar, Gift, Scissors, Navigation, CircleDollarSign } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';
import { useSolana } from '@/react-app/providers/SolanaProvider';
import Logo from '@/react-app/components/Logo';
import GameCard from '@/react-app/components/GameCard';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import WalletConnection from '@/react-app/components/WalletConnection';
import DepositModal from '@/react-app/components/DepositModal';
import CompactSportsCard from '@/react-app/components/CompactSportsCard';
import Footer from '@/react-app/components/Footer';
import { analytics } from '@/react-app/utils/analytics';

const games = [
  { 
    id: 'dice', 
    title: 'Dice', 
    icon: Dices, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/dice-game-icon-no-text.png',
    description: 'Roll under to win', 
    active: true 
  },
  { 
    id: 'crash', 
    title: 'Crash', 
    icon: TrendingUp, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/crash-game-icon-no-text.png',
    description: 'Cash out before crash', 
    active: true 
  },
  { 
    id: 'mines', 
    title: 'Mines', 
    icon: Bomb, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/mines-game-icon-no-text.png',
    description: 'Find gems, avoid mines', 
    active: true 
  },
  { 
    id: 'plinko', 
    title: 'Plinko', 
    icon: Zap, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/plinko-game-icon-no-text.png',
    description: 'Drop balls for multipliers', 
    active: true 
  },
  { 
    id: 'slots', 
    title: 'Slots', 
    icon: Cherry, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/slots-game-icon-no-text.png',
    description: 'Match symbols to win', 
    active: true 
  },
  { 
    id: 'roulette', 
    title: 'Roulette', 
    icon: RotateCcw, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/roulette-game-icon-no-text.png',
    description: 'Red, black, or green', 
    active: true 
  },
  { 
    id: 'blackjack', 
    title: 'Blackjack', 
    icon: Spade, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/blackjack-game-icon-no-text.png',
    description: 'Beat the dealer', 
    active: true 
  },
  { 
    id: 'poker', 
    title: 'Video Poker', 
    icon: Crown, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/poker-game-icon-no-text.png',
    description: 'Jacks or better', 
    active: true 
  },
  { 
    id: 'rockpaperscissors', 
    title: 'Rock Paper Scissors', 
    icon: Scissors, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/ChatGPT-Image-Oct-20-2025-09_03_53-PM.png',
    description: 'Beat the computer', 
    active: true 
  },
  { 
    id: 'coinflip', 
    title: 'Coin Flip', 
    icon: CircleDollarSign, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/ChatGPT-Image-Oct-20-2025-09_16_16-PM.png',
    description: 'Heads or tails', 
    active: true 
  },
  { 
    id: 'crossroads', 
    title: 'Crossroads', 
    icon: Navigation, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/crash-game-icon-no-text.png',
    description: 'Pick a direction', 
    active: true 
  },
  { 
    id: 'scratchoff', 
    title: 'Scratch Off', 
    icon: Gift, 
    iconUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/slots-game-icon-no-text.png',
    description: 'Lottery tickets', 
    active: true 
  },
];

const promoCards = [
  { title: 'Daily Bonus', icon: Gift, description: 'Free $10 every 24 hours', color: 'from-purple-600 to-pink-600' },
  { title: 'Leaderboard', icon: Trophy, description: 'Top players win big', color: 'from-cyan-600 to-blue-600' },
  { title: 'VIP Program', icon: Crown, description: 'Exclusive rewards', color: 'from-yellow-500 to-orange-600' },
];

export default function Lobby() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { } = useSolana();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Detect screen size for desktop-optimized layouts
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Track user login and session start
  useEffect(() => {
    if (user) {
      analytics.setUserId(user.id);
      analytics.track('lobby_view', { userId: user.id });
    } else {
      analytics.track('lobby_view_anonymous');
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Enhanced Header - Desktop Optimized */}
      <header className={`px-4 py-3 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50 ${isDesktop ? 'py-4' : ''}`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex-1 pl-14">
            {isDesktop && (
              <motion.div 
                className="flex items-center space-x-4"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-400 font-medium">50,847 Online</span>
                </div>
                <div className="text-gray-400 text-sm">•</div>
                <div className="text-sm text-gray-400">$2.1M Paid Today</div>
              </motion.div>
            )}
          </div>
          <div className="flex-1 flex justify-center">
            <Logo size={isDesktop ? "large" : "medium"} />
          </div>
          <div className="flex-1 flex justify-end">
            <BalanceDisplay />
          </div>
        </div>
      </header>

      <main className={`max-w-7xl mx-auto px-6 py-8 space-y-8 ${isDesktop ? 'px-8 py-12 space-y-12' : ''}`}>
        {/* Enhanced Hero Section - Desktop/Mobile Optimized */}
        <motion.section 
          className={`text-center glass-panel relative overflow-hidden ${
            isDesktop 
              ? 'py-16 px-12' 
              : 'py-4'
          }`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Desktop Background Effects */}
          {isDesktop && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 animate-pulse"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
            </>
          )}
          
          <div className="relative z-10">
            <motion.h1 
              className={`font-bold mb-4 text-white ${
                isDesktop 
                  ? 'text-5xl lg:text-6xl mb-6 gradient-text font-heading' 
                  : 'text-xl md:text-2xl mb-2'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              {isDesktop ? 'Play Fast. Win Fair.' : 'Instant. Fair. Profitable.'}
            </motion.h1>
            
            {isDesktop && (
              <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <img 
                  src="https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/hero-banner.jpg"
                  alt="Coin Hype Casino Hero"
                  className="rounded-xl max-w-md shadow-2xl"
                />
              </motion.div>
            )}
            
            <motion.p 
              className={`text-gray-300 mb-6 mx-auto ${
                isDesktop 
                  ? 'text-lg max-w-3xl leading-relaxed' 
                  : 'text-sm max-w-xl mb-4'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              {isDesktop 
                ? 'Experience the future of online gaming with Solana-powered instant payouts, provably fair algorithms, and premium casino games. Join 50,000+ players winning real crypto rewards.'
                : 'Solana-powered casino with proven transparency and lightning payouts.'
              }
            </motion.p>
            
            <motion.div
              className={`flex gap-4 justify-center items-center ${
                isDesktop 
                  ? 'flex-row space-x-6' 
                  : 'flex-col sm:flex-row gap-2'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <button
                onClick={() => navigate('/games/dice')}
                className={`neon-button font-semibold rounded-lg ${
                  isDesktop 
                    ? 'px-8 py-4 text-lg' 
                    : 'px-5 py-2 text-sm'
                }`}
              >
                {isDesktop ? '🎲 Start Playing Free' : 'Play Demo'}
              </button>
              {!user && (
                <button
                  onClick={() => navigate('/create-account')}
                  className={`border border-cyan-400 text-cyan-400 rounded-lg hover:bg-cyan-400/10 font-semibold transition-colors ${
                    isDesktop 
                      ? 'px-8 py-4 text-lg' 
                      : 'px-5 py-2 text-sm'
                  }`}
                >
                  {isDesktop ? '⚡ Sign Up for Real Rewards' : 'Sign Up Free'}
                </button>
              )}
            </motion.div>

            {/* Desktop Live Stats */}
            {isDesktop && (
              <motion.div
                className="flex justify-center space-x-8 mt-8 pt-6 border-t border-white/10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <div className="text-center">
                  <p className="text-2xl font-bold text-cyan-400">$2.1M</p>
                  <p className="text-sm text-gray-400">Paid Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">50K+</p>
                  <p className="text-sm text-gray-400">Active Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-pink-400">&lt;1s</p>
                  <p className="text-sm text-gray-400">Avg Payout</p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.section>

        {/* Enhanced Most Popular Games Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h2 className={`font-bold text-white ${isDesktop ? 'text-3xl' : 'text-xl md:text-2xl'}`}>
                🔥 Most Popular
              </h2>
              {isDesktop && (
                <motion.div 
                  className="px-3 py-1 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-full"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="text-sm text-red-400 font-medium">HOT</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className={`font-medium ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {isDesktop ? '15,432 playing now' : 'Live Now'}
                </span>
              </div>
              {isDesktop && (
                <button 
                  onClick={() => navigate('/lobby')}
                  className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  View All Games →
                </button>
              )}
            </div>
          </div>
          <div className={`grid gap-4 ${
            isDesktop 
              ? 'grid-cols-6 lg:grid-cols-8 gap-6' 
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3 md:gap-4'
          }`}>
            {games.slice(0, isDesktop ? 8 : 6).map((game) => (
              <motion.div 
                key={game.id} 
                variants={itemVariants}
                whileHover={isDesktop ? { y: -8, scale: 1.05 } : {}}
                className={isDesktop ? 'relative group' : ''}
              >
                <GameCard
                  title={game.title}
                  icon={game.icon}
                  iconUrl={game.iconUrl}
                  description={game.description}
                  isActive={game.active}
                  onClick={() => game.active && navigate(`/games/${game.id}`)}
                />
                {/* Desktop-only hover overlay */}
                {isDesktop && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-cyan-500/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none"
                    initial={{ opacity: 0 }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Compact Sports Preview */}
        <CompactSportsCard onNavigateToSports={() => navigate('/sports')} />

        {/* Enhanced All Games Grid */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-bold text-white ${isDesktop ? 'text-2xl' : 'text-lg md:text-xl mb-3'}`}>
              All Casino Games
            </h2>
            {isDesktop && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Sort by:</span>
                  <select className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-sm text-white">
                    <option>Popularity</option>
                    <option>Newest</option>
                    <option>RTP</option>
                  </select>
                </div>
                <div className="text-sm text-gray-400">
                  {games.filter(g => g.active).length} games available
                </div>
              </div>
            )}
          </div>
          <div className={`grid gap-3 ${
            isDesktop 
              ? 'grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-4' 
              : 'grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 sm:gap-3'
          }`}>
            {games.map((game) => (
              <motion.div 
                key={game.id} 
                variants={itemVariants}
                whileHover={isDesktop ? { y: -4, scale: 1.02 } : {}}
                className={isDesktop ? 'relative group' : ''}
              >
                <GameCard
                  title={game.title}
                  icon={game.icon}
                  iconUrl={game.iconUrl}
                  description={game.description}
                  isActive={game.active}
                  onClick={() => game.active && navigate(`/games/${game.id}`)}
                />
                {/* Desktop game preview overlay */}
                {isDesktop && game.active && (
                  <motion.div
                    className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center"
                    initial={{ opacity: 0 }}
                  >
                    <div className="text-center">
                      <motion.button
                        className="neon-button px-4 py-2 text-sm mb-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate(`/games/${game.id}`)}
                      >
                        Play Now
                      </motion.button>
                      <p className="text-xs text-gray-300">{game.description}</p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Enhanced Promotions Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={`font-bold text-white ${isDesktop ? 'text-2xl' : 'text-lg md:text-xl mb-3'}`}>
              💎 Bonuses & Rewards
            </h2>
            {isDesktop && (
              <button className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
                View All Promotions →
              </button>
            )}
          </div>
          <div className={`grid gap-3 ${
            isDesktop 
              ? 'grid-cols-3 gap-6' 
              : 'grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3'
          }`}>
            {promoCards.map((promo) => (
              <motion.div
                key={promo.title}
                variants={itemVariants}
                className={`glass-panel cursor-pointer hover:scale-102 transition-transform ${
                  isDesktop ? 'p-6 hover:scale-105' : 'p-3'
                }`}
                whileHover={isDesktop ? { y: -4 } : {}}
              >
                <div className={`flex items-center ${isDesktop ? 'flex-col text-center space-y-4' : 'space-x-2'}`}>
                  <div className={`rounded-full bg-gradient-to-r ${promo.color} ${
                    isDesktop ? 'p-4' : 'p-1.5'
                  }`}>
                    <promo.icon className={`text-white ${isDesktop ? 'w-8 h-8' : 'w-3 h-3'}`} />
                  </div>
                  <div className={`${isDesktop ? 'space-y-2' : 'flex-1 min-w-0'}`}>
                    <h3 className={`font-semibold text-white ${isDesktop ? 'text-lg' : 'text-xs'}`}>
                      {promo.title}
                    </h3>
                    <p className={`text-gray-400 ${isDesktop ? 'text-sm leading-relaxed' : 'text-xs truncate'}`}>
                      {promo.description}
                    </p>
                    {isDesktop && (
                      <motion.button
                        className="neon-button px-4 py-2 text-sm mt-3"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Claim Now
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Enhanced Stats Section */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={`grid gap-4 ${
            isDesktop 
              ? 'grid-cols-4 gap-6' 
              : 'grid-cols-2 md:grid-cols-4 gap-3 md:gap-4'
          }`}
        >
          {[
            { icon: Zap, value: '<1s', label: 'Payouts', color: 'purple', gradient: 'from-purple-400 to-purple-600' },
            { icon: DollarSign, value: '$2.1M', label: 'Paid Today', color: 'green', gradient: 'from-green-400 to-green-600' },
            { icon: Trophy, value: '50K+', label: 'Players', color: 'yellow', gradient: 'from-yellow-400 to-yellow-600' },
            { icon: Calendar, value: '24/7', label: 'Live Support', color: 'cyan', gradient: 'from-cyan-400 to-cyan-600' }
          ].map((stat, index) => (
            <motion.div 
              key={stat.label}
              variants={itemVariants} 
              className={`glass-panel text-center relative overflow-hidden group ${
                isDesktop ? 'p-8 hover:scale-105' : 'p-4'
              }`}
              whileHover={isDesktop ? { y: -4 } : {}}
            >
              {/* Desktop background gradient effect */}
              {isDesktop && (
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              )}
              
              <div className="relative z-10">
                <motion.div
                  className={`inline-flex items-center justify-center rounded-full mb-3 ${
                    isDesktop ? 'w-16 h-16 bg-gradient-to-br ' + stat.gradient : 'w-12 h-12'
                  }`}
                  animate={isDesktop ? { rotate: [0, 5, -5, 0] } : {}}
                  transition={{ duration: 4, repeat: Infinity, delay: index * 0.5 }}
                >
                  <stat.icon className={`text-white ${isDesktop ? 'w-8 h-8' : 'w-6 h-6'}`} />
                </motion.div>
                
                <motion.p 
                  className={`font-bold text-white mb-1 ${isDesktop ? 'text-3xl' : 'text-lg'}`}
                  animate={isDesktop ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                >
                  {stat.value}
                </motion.p>
                
                <p className={`text-gray-400 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {stat.label}
                </p>
                
                {isDesktop && (
                  <motion.div
                    className="absolute top-2 right-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </motion.section>

        {/* Enhanced CTA Section */}
        {!user && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-panel text-center relative overflow-hidden ${
              isDesktop ? 'p-12' : 'p-6'
            }`}
          >
            {/* Desktop background effects */}
            {isDesktop && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-pink-500/5"></div>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"></div>
              </>
            )}
            
            <div className="relative z-10">
              <motion.h3 
                className={`font-bold text-white mb-4 ${
                  isDesktop ? 'text-3xl gradient-text mb-6' : 'text-lg mb-2'
                }`}
                animate={isDesktop ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 3, repeat: Infinity }}
              >
                {isDesktop ? '🚀 Ready to Win Real Crypto?' : 'Ready for Real Crypto Rewards?'}
              </motion.h3>
              
              <p className={`text-gray-400 mb-6 ${
                isDesktop ? 'text-lg max-w-2xl mx-auto leading-relaxed' : 'text-sm mb-4'
              }`}>
                {isDesktop 
                  ? 'Join the future of online gaming. Connect your wallet and start winning with transparent, provably fair games. No hidden fees, instant payouts, maximum fun.'
                  : 'Connect your wallet and start winning with transparent, provably fair games.'
                }
              </p>
              
              <div className={`flex gap-4 justify-center ${
                isDesktop ? 'space-x-6' : 'flex-col sm:flex-row gap-3'
              }`}>
                <motion.button
                  onClick={() => navigate('/create-account')}
                  className={`neon-button font-semibold rounded-lg ${
                    isDesktop ? 'px-8 py-4 text-lg' : 'px-6 py-2.5'
                  }`}
                  whileHover={isDesktop ? { scale: 1.05, y: -2 } : {}}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDesktop ? '🎯 Get Started Free' : 'Get Started Free'}
                </motion.button>
                
                <div className={isDesktop ? 'scale-110' : ''}>
                  <WalletConnection />
                </div>
              </div>
              
              {isDesktop && (
                <motion.div
                  className="flex justify-center space-x-8 mt-8 pt-6 border-t border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">No KYC Required</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Instant Withdrawals</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Provably Fair</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}
      </main>

      {/* Modals */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="relative">
            <button
              onClick={() => setShowWalletModal(false)}
              className="absolute -top-2 -right-2 w-8 h-8 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center z-10"
            >
              ×
            </button>
            <WalletConnection />
          </div>
        </div>
      )}

      {showDepositModal && (
        <DepositModal onClose={() => setShowDepositModal(false)} />
      )}
      
      <Footer />
    </div>
  );
}
