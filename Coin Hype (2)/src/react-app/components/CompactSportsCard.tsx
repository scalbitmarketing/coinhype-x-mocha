import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, TrendingUp } from 'lucide-react';

const FEATURED_GAMES = [
  {
    id: '1',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeOdds: -110,
    awayOdds: +150,
    status: 'live' as const,
    time: 'Q3 8:45',
    sport: 'NBA',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/lakers-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/warriors-logo.png',
  },
  {
    id: '2',
    homeTeam: 'Cowboys',
    awayTeam: 'Giants',
    homeOdds: -180,
    awayOdds: +240,
    status: 'upcoming' as const,
    time: 'Sun 1:00 PM',
    sport: 'NFL',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/cowboys-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/giants-logo.png',
  },
  {
    id: '3',
    homeTeam: 'Dodgers',
    awayTeam: 'Yankees',
    homeOdds: -140,
    awayOdds: +180,
    status: 'upcoming' as const,
    time: 'Tonight 7:00 PM',
    sport: 'MLB',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/dodgers-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/yankees-logo.png',
  }
];

interface CompactSportsCardProps {
  onNavigateToSports: () => void;
}

export default function CompactSportsCard({ onNavigateToSports }: CompactSportsCardProps) {
  const [quickBets, setQuickBets] = useState<Array<{ gameId: string; team: string; odds: number }>>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleQuickBet = (gameId: string, team: string, odds: number) => {
    const existingBetIndex = quickBets.findIndex(bet => bet.gameId === gameId);
    
    if (existingBetIndex >= 0) {
      const updatedBets = [...quickBets];
      updatedBets[existingBetIndex] = { gameId, team, odds };
      setQuickBets(updatedBets);
    } else {
      setQuickBets(prev => [...prev, { gameId, team, odds }]);
    }
  };

  const calculateQuickParlayOdds = () => {
    if (quickBets.length === 0) return 0;
    
    let totalOdds = 1;
    quickBets.forEach(bet => {
      const probability = bet.odds > 0 ? 100 / (bet.odds + 100) : Math.abs(bet.odds) / (Math.abs(bet.odds) + 100);
      totalOdds *= (1 / probability);
    });
    
    const fairOdds = (totalOdds - 1) * 100;
    return Math.round(fairOdds * 0.95); // 5% house edge
  };

  return (
    <motion.section
      className={`glass-panel relative overflow-hidden group ${isDesktop ? 'p-6' : 'p-3'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isDesktop ? { scale: 1.02, y: -4 } : {}}
    >
      {/* Desktop background effects */}
      {isDesktop && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-pink-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-cyan-600"></div>
        </>
      )}
      
      <div className={`flex items-center justify-between relative z-10 ${isDesktop ? 'mb-6' : 'mb-3'}`}>
        <div className="flex items-center space-x-3">
          <motion.div 
            className={`rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 ${isDesktop ? 'p-3' : 'p-1'}`}
            whileHover={isDesktop ? { scale: 1.1, rotate: 5 } : {}}
          >
            <Trophy className={`text-white ${isDesktop ? 'w-6 h-6' : 'w-3 h-3'}`} />
          </motion.div>
          <div>
            <h3 className={`font-bold text-white ${isDesktop ? 'text-lg' : 'text-sm'}`}>
              🏆 Live Sports
            </h3>
            <p className={`text-gray-400 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
              {isDesktop ? 'Live betting • Real-time odds • Instant payouts' : 'Quick bets • Real-time odds'}
            </p>
          </div>
        </div>
        
        <motion.button
          onClick={onNavigateToSports}
          className={`flex items-center space-x-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded text-white font-medium transition-all ${
            isDesktop ? 'px-4 py-2 text-sm' : 'px-2.5 py-1 text-xs space-x-1'
          }`}
          whileHover={isDesktop ? { scale: 1.05, x: 2 } : {}}
          whileTap={{ scale: 0.95 }}
        >
          <span>{isDesktop ? 'View All Sports' : 'View All'}</span>
          <ArrowRight className={isDesktop ? 'w-4 h-4' : 'w-2.5 h-2.5'} />
        </motion.button>
      </div>

      {/* Enhanced Live Games */}
      <div className={`grid gap-3 relative z-10 ${
        isDesktop ? 'grid-cols-1 lg:grid-cols-2 gap-4 mb-6' : 'grid-cols-1 gap-2 mb-3'
      }`}>
        {FEATURED_GAMES.slice(0, isDesktop ? 3 : 2).map((game) => (
          <motion.div 
            key={game.id} 
            className={`bg-gray-800/50 rounded border border-gray-700/50 relative overflow-hidden group ${
              isDesktop ? 'p-4 hover:bg-gray-700/50 hover:border-cyan-400/30' : 'p-2'
            }`}
            whileHover={isDesktop ? { scale: 1.02, y: -2 } : {}}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Desktop glow effect */}
            {isDesktop && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              />
            )}
            
            <div className={`flex items-center justify-between relative z-10 ${isDesktop ? 'mb-3' : 'mb-1'}`}>
              <div className="flex items-center space-x-2">
                <motion.div 
                  className={`rounded-full ${game.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'} ${
                    isDesktop ? 'w-2 h-2' : 'w-1 h-1'
                  }`}
                  animate={game.status === 'live' ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                />
                <span className={`text-gray-400 font-bold ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {game.sport}
                </span>
                <span className={`text-gray-500 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {game.time}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <motion.div 
                  className={`bg-green-500 rounded-full animate-pulse ${isDesktop ? 'w-2 h-2' : 'w-1 h-1'}`}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className={`text-green-400 font-medium ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {isDesktop ? 'LIVE NOW' : 'Live'}
                </span>
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-2 relative z-10 ${isDesktop ? 'gap-3' : 'gap-1'}`}>
              {/* Away Team */}
              <motion.button
                onClick={() => handleQuickBet(game.id, game.awayTeam, game.awayOdds)}
                className={`flex items-center justify-between rounded transition-all relative overflow-hidden ${
                  isDesktop ? 'p-3 text-sm' : 'p-1.5 text-xs'
                } ${
                  quickBets.some(bet => bet.gameId === game.id && bet.team === game.awayTeam)
                    ? 'border border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/25'
                    : 'bg-gray-700/50 hover:bg-gray-600/50 border border-transparent hover:border-gray-500/50'
                }`}
                whileHover={{ scale: isDesktop ? 1.03 : 1.01, y: isDesktop ? -1 : 0 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Desktop enhanced styling */}
                {isDesktop && quickBets.some(bet => bet.gameId === game.id && bet.team === game.awayTeam) && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <div className={`flex items-center relative z-10 ${isDesktop ? 'space-x-2' : 'space-x-1'}`}>
                  <img 
                    src={game.awayLogoUrl} 
                    alt={game.awayTeam} 
                    className={`object-contain ${isDesktop ? 'w-5 h-5' : 'w-3 h-3'}`} 
                  />
                  <span className={`text-white font-medium ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                    {game.awayTeam}
                  </span>
                </div>
                <span className={`text-white font-bold relative z-10 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {game.awayOdds > 0 ? '+' : ''}{game.awayOdds}
                </span>
              </motion.button>

              {/* Home Team */}
              <motion.button
                onClick={() => handleQuickBet(game.id, game.homeTeam, game.homeOdds)}
                className={`flex items-center justify-between rounded transition-all relative overflow-hidden ${
                  isDesktop ? 'p-3 text-sm' : 'p-1.5 text-xs'
                } ${
                  quickBets.some(bet => bet.gameId === game.id && bet.team === game.homeTeam)
                    ? 'border border-cyan-400 bg-cyan-400/20 shadow-lg shadow-cyan-500/25'
                    : 'bg-gray-700/50 hover:bg-gray-600/50 border border-transparent hover:border-gray-500/50'
                }`}
                whileHover={{ scale: isDesktop ? 1.03 : 1.01, y: isDesktop ? -1 : 0 }}
                whileTap={{ scale: 0.97 }}
              >
                {/* Desktop enhanced styling */}
                {isDesktop && quickBets.some(bet => bet.gameId === game.id && bet.team === game.homeTeam) && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
                
                <div className={`flex items-center relative z-10 ${isDesktop ? 'space-x-2' : 'space-x-1'}`}>
                  <img 
                    src={game.homeLogoUrl} 
                    alt={game.homeTeam} 
                    className={`object-contain ${isDesktop ? 'w-5 h-5' : 'w-3 h-3'}`} 
                  />
                  <span className={`text-white font-medium ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                    {game.homeTeam}
                  </span>
                </div>
                <span className={`text-white font-bold relative z-10 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                  {game.homeOdds > 0 ? '+' : ''}{game.homeOdds}
                </span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Enhanced Quick Parlay Section */}
      {quickBets.length > 0 && (
        <motion.div
          className={`bg-gradient-to-r from-gray-800 to-gray-700 rounded border border-cyan-400/30 relative z-10 ${
            isDesktop ? 'mt-4 p-4' : 'mt-2 p-2'
          }`}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <div className={`flex items-center justify-between ${isDesktop ? 'mb-3' : 'mb-1'}`}>
            <div className="flex items-center space-x-2">
              <TrendingUp className={`text-cyan-400 ${isDesktop ? 'w-4 h-4' : 'w-2.5 h-2.5'}`} />
              <span className={`font-bold text-white ${isDesktop ? 'text-sm' : 'text-xs'}`}>
                Parlay ({quickBets.length})
              </span>
            </div>
            <button
              onClick={() => setQuickBets([])}
              className={`text-gray-400 hover:text-white ${isDesktop ? 'text-sm' : 'text-xs'}`}
            >
              Clear
            </button>
          </div>
          
          <div className={`flex items-center justify-between ${isDesktop ? 'mb-3' : 'mb-1'}`}>
            <div className={`text-gray-400 truncate ${isDesktop ? 'text-sm' : 'text-xs'}`}>
              {quickBets.map(bet => bet.team).slice(0, 2).join(' • ')}
              {quickBets.length > 2 && '...'}
            </div>
            <div className={`font-bold text-cyan-400 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
              +{calculateQuickParlayOdds()}
            </div>
          </div>
          
          <motion.button
            onClick={onNavigateToSports}
            className={`w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded font-bold text-white transition-all ${
              isDesktop ? 'py-2 text-sm' : 'py-1 text-xs'
            }`}
            whileHover={isDesktop ? { scale: 1.02 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            {isDesktop ? '🎯 Place Bet in Sports' : 'Place Bet in Sports'}
          </motion.button>
        </motion.div>
      )}

      <div className={`text-center relative z-10 ${isDesktop ? 'mt-4' : 'mt-2'}`}>
        <p className={`text-gray-500 ${isDesktop ? 'text-sm' : 'text-xs'}`}>
          {isDesktop ? 'Live betting • 50+ sports markets • Instant payouts' : 'Live betting • 50+ sports markets'}
        </p>
      </div>
    </motion.section>
  );
}
