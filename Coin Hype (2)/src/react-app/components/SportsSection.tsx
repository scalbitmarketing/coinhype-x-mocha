import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Users, TrendingUp, Star, Zap, Target, GraduationCap } from 'lucide-react';
import EnhancedSportsCard from './EnhancedSportsCard';

const SPORTS_GAMES = [
  {
    id: '1',
    homeTeam: 'Lakers',
    awayTeam: 'Warriors',
    homeScore: 95,
    awayScore: 102,
    homeOdds: -110,
    awayOdds: +150,
    overUnder: 210.5,
    overOdds: -110,
    underOdds: -110,
    status: 'live' as const,
    time: 'Q3 8:45',
    sport: 'NBA',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/lakers-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/warriors-logo.png',
    currentTotal: 197
  },
  {
    id: '2',
    homeTeam: 'Cowboys',
    awayTeam: 'Giants',
    homeOdds: -180,
    awayOdds: +240,
    overUnder: 47.5,
    overOdds: -105,
    underOdds: -115,
    status: 'upcoming' as const,
    time: 'Sun 1:00 PM',
    sport: 'NFL',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/cowboys-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/giants-logo.png'
  },
  {
    id: '3',
    homeTeam: 'Real Madrid',
    awayTeam: 'Barcelona',
    homeScore: 1,
    awayScore: 0,
    homeOdds: +120,
    awayOdds: -160,
    overUnder: 2.5,
    overOdds: +100,
    underOdds: -120,
    status: 'live' as const,
    time: '78\'',
    sport: 'Soccer',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/real-madrid-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/barcelona-logo.png',
    currentTotal: 1
  },
  {
    id: '4',
    homeTeam: 'Celtics',
    awayTeam: 'Heat',
    homeOdds: -135,
    awayOdds: +200,
    overUnder: 215.5,
    overOdds: -110,
    underOdds: -110,
    status: 'upcoming' as const,
    time: 'Tonight 8:00 PM',
    sport: 'NBA',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/celtics-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/heat-logo.png'
  },
  {
    id: '5',
    homeTeam: 'Dodgers',
    awayTeam: 'Yankees',
    homeScore: 3,
    awayScore: 2,
    homeOdds: -140,
    awayOdds: +180,
    overUnder: 8.5,
    overOdds: -105,
    underOdds: -115,
    status: 'live' as const,
    time: 'B7 2 outs',
    sport: 'MLB',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/dodgers-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/yankees-logo.png',
    currentTotal: 5
  },
  {
    id: '6',
    homeTeam: 'Duke',
    awayTeam: 'Kentucky',
    homeOdds: -120,
    awayOdds: +165,
    overUnder: 145.5,
    overOdds: -110,
    underOdds: -110,
    status: 'upcoming' as const,
    time: 'Sat 9:00 PM',
    sport: 'College Basketball',
    league: 'NCAA',
    homeLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/duke-logo.png',
    awayLogoUrl: 'https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/kentucky-logo.png'
  },
  {
    id: '7',
    homeTeam: 'Alabama',
    awayTeam: 'Georgia',
    homeOdds: +110,
    awayOdds: -130,
    overUnder: 52.5,
    overOdds: -108,
    underOdds: -112,
    status: 'upcoming' as const,
    time: 'Sat 3:30 PM',
    sport: 'College Football',
    league: 'SEC',
    homeLogoUrl: 'https://via.placeholder.com/64/A50034/FFFFFF?text=ALA',
    awayLogoUrl: 'https://via.placeholder.com/64/BA0C2F/FFFFFF?text=UGA'
  },
  {
    id: '8',
    homeTeam: 'Texas',
    awayTeam: 'Michigan',
    homeOdds: -105,
    awayOdds: -115,
    overUnder: 49.5,
    overOdds: -110,
    underOdds: -110,
    status: 'upcoming' as const,
    time: 'Sat 12:00 PM',
    sport: 'College Football',
    league: 'CFP',
    homeLogoUrl: 'https://via.placeholder.com/64/BF5700/FFFFFF?text=TEX',
    awayLogoUrl: 'https://via.placeholder.com/64/00274C/FFCB05?text=MICH'
  }
];

const SPORTS_TABS = [
  { id: 'live', name: 'Live', icon: Zap, color: 'text-red-400' },
  { id: 'nba', name: 'NBA', icon: Trophy, color: 'text-orange-400' },
  { id: 'nfl', name: 'NFL', icon: Users, color: 'text-blue-400' },
  { id: 'mlb', name: 'MLB', icon: Target, color: 'text-green-400' },
  { id: 'college', name: 'College', icon: GraduationCap, color: 'text-purple-400' },
  { id: 'soccer', name: 'Soccer', icon: Star, color: 'text-yellow-400' },
];

export default function SportsSection() {
  const [activeTab, setActiveTab] = useState('live');
  const [parlayBets, setParlayBets] = useState<Array<{ 
    gameId: string; 
    betType: string;
    team: string; 
    odds: number;
    value?: number;
  }>>([]);

  const handleBet = (gameId: string, betType: string, team: string, odds: number, value?: number) => {
    const game = SPORTS_GAMES.find(g => g.id === gameId);
    if (!game) return;
    
    // Check if this bet already exists in parlay
    const existingBetIndex = parlayBets.findIndex(bet => bet.gameId === gameId && bet.betType === betType);
    
    if (existingBetIndex >= 0) {
      // Update existing bet
      const updatedBets = [...parlayBets];
      updatedBets[existingBetIndex] = { gameId, betType, team, odds, value };
      setParlayBets(updatedBets);
    } else {
      // Add new bet to parlay
      setParlayBets(prev => [...prev, { gameId, betType, team, odds, value }]);
    }
  };

  const removeBet = (gameId: string, betType: string) => {
    setParlayBets(prev => prev.filter(bet => !(bet.gameId === gameId && bet.betType === betType)));
  };

  const calculateParlayOdds = () => {
    if (parlayBets.length === 0) return 0;
    
    let totalOdds = 1;
    parlayBets.forEach(bet => {
      const probability = bet.odds > 0 ? 100 / (bet.odds + 100) : Math.abs(bet.odds) / (Math.abs(bet.odds) + 100);
      totalOdds *= (1 / probability);
    });
    
    // Apply 5% house edge on parlays
    const fairOdds = (totalOdds - 1) * 100;
    return Math.round(fairOdds * 0.95);
  };

  const calculateParlayPayout = (betAmount: number = 10) => {
    const odds = calculateParlayOdds();
    if (odds <= 0) return betAmount;
    return betAmount * (1 + odds / 100);
  };

  const filteredGames = SPORTS_GAMES.filter(game => {
    if (activeTab === 'live') return game.status === 'live';
    if (activeTab === 'nba') return game.sport === 'NBA';
    if (activeTab === 'nfl') return game.sport === 'NFL';
    if (activeTab === 'mlb') return game.sport === 'MLB';
    if (activeTab === 'college') return game.sport.includes('College');
    if (activeTab === 'soccer') return game.sport === 'Soccer';
    return true;
  });

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
    <motion.section
      className="glass-panel p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Live Sports Betting</h2>
            <p className="text-sm text-gray-400">Live odds • House edge displayed • Over/under sliders</p>
          </div>
        </div>
        
        {parlayBets.length > 0 && (
          <div className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-400/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Parlay ({parlayBets.length} picks)</div>
            <div className="text-lg font-bold text-cyan-400">+{calculateParlayOdds()}</div>
            <div className="text-xs text-gray-400">Payout: ${calculateParlayPayout().toFixed(2)}</div>
          </div>
        )}
      </div>

      {/* Sports Tabs */}
      <div className="grid grid-cols-3 md:flex md:space-x-1 gap-1 md:gap-0 mb-6 bg-gray-800/50 rounded-lg p-1">
        {SPORTS_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-md transition-all text-xs md:text-sm ${
              activeTab === tab.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
            }`}
          >
            <tab.icon className={`w-3 h-3 md:w-4 md:h-4 ${activeTab === tab.id ? tab.color : ''}`} />
            <span className="font-medium">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Live Odds Indicator */}
      <div className="flex items-center justify-center mb-4 space-x-4 text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-green-400 font-medium">Live Odds</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">House Edge:</span>
          <span className="text-red-400 font-medium">4.5-9.5%</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Lines Update:</span>
          <span className="text-cyan-400 font-medium">Real-time</span>
        </div>
      </div>

      {/* Games Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
        variants={containerVariants}
      >
        {filteredGames.map((game) => (
          <motion.div key={game.id} variants={itemVariants}>
            <EnhancedSportsCard 
              game={game} 
              onBet={(betType, team, odds, value) => handleBet(game.id, betType, team, odds, value)}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Parlay Summary */}
      {parlayBets.length > 0 && (
        <motion.div
          className="mt-6 p-4 bg-gradient-to-r from-gray-800 to-gray-700 rounded-lg border border-cyan-400/30"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <span>Your Parlay Slip</span>
            </h3>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400">
                House Edge: <span className="text-red-400">5.0%</span>
              </div>
              <button
                onClick={() => setParlayBets([])}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear All
              </button>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            {parlayBets.map((bet) => (
              <div key={`${bet.gameId}-${bet.betType}`} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                <div className="flex-1">
                  <span className="text-sm text-white font-medium">{bet.team}</span>
                  <span className="text-xs text-gray-400 ml-2">({bet.betType})</span>
                  {bet.value && (
                    <span className="text-xs text-cyan-400 ml-1">@ {bet.value}</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-cyan-400">
                    {bet.odds > 0 ? '+' : ''}{bet.odds}
                  </span>
                  <button
                    onClick={() => removeBet(bet.gameId, bet.betType)}
                    className="text-xs text-red-400 hover:text-red-300 w-4 h-4 flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <p className="text-sm text-gray-400">{parlayBets.length} Team Parlay</p>
              <p className="text-xl font-bold text-cyan-400">+{calculateParlayOdds()}</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Bet Amount ($)</label>
              <input 
                type="number" 
                defaultValue="10" 
                className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <button className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-lg text-white font-bold transition-all">
              Place Parlay Bet
            </button>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-600/30">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Potential Payout:</span>
              <span className="text-green-400 font-bold">${calculateParlayPayout().toFixed(2)}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}
