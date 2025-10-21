import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';

interface SportsCardProps {
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    homeOdds: number;
    awayOdds: number;
    status: 'live' | 'upcoming' | 'finished';
    time: string;
    sport: string;
    homeLogoUrl: string;
    awayLogoUrl: string;
  };
  onBet: (teamType: 'home' | 'away', odds: number) => void;
}

export default function SportsCard({ game, onBet }: SportsCardProps) {
  const isLive = game.status === 'live';
  
  return (
    <motion.div
      className="glass-panel p-4 hover:scale-[1.02] transition-all duration-300"
      whileHover={{ y: -2 }}
    >
      {/* Game Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
          <span className="text-xs text-gray-400 uppercase font-bold">{game.sport}</span>
          {isLive && <span className="text-xs text-red-400 font-bold">LIVE</span>}
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{game.time}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <img 
              src={game.awayLogoUrl} 
              alt={game.awayTeam}
              className="w-8 h-8 object-contain"
            />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{game.awayTeam}</p>
              {isLive && game.awayScore !== undefined && (
                <p className="text-gray-400 text-xs">{game.awayScore} points</p>
              )}
            </div>
          </div>
          <motion.button
            onClick={() => onBet('away', game.awayOdds)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold text-white min-w-[60px] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {game.awayOdds > 0 ? '+' : ''}{game.awayOdds}
          </motion.button>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <img 
              src={game.homeLogoUrl} 
              alt={game.homeTeam}
              className="w-8 h-8 object-contain"
            />
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{game.homeTeam}</p>
              {isLive && game.homeScore !== undefined && (
                <p className="text-gray-400 text-xs">{game.homeScore} points</p>
              )}
            </div>
          </div>
          <motion.button
            onClick={() => onBet('home', game.homeOdds)}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold text-white min-w-[60px] transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {game.homeOdds > 0 ? '+' : ''}{game.homeOdds}
          </motion.button>
        </div>
      </div>

      {/* Parlay Button */}
      <motion.button
        className="w-full mt-3 p-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded text-xs font-bold text-white transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex items-center justify-center space-x-1">
          <TrendingUp className="w-3 h-3" />
          <span>Add to Parlay</span>
        </div>
      </motion.button>
    </motion.div>
  );
}
