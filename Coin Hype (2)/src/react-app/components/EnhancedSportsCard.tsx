import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, TrendingUp, Target, Minus, Plus } from 'lucide-react';

import { useGameStore } from '@/react-app/stores/gameStore';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';

const soundManager = new EnhancedSoundManager();

interface EnhancedSportsCardProps {
  game: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number;
    awayScore?: number;
    homeOdds: number;
    awayOdds: number;
    overUnder: number;
    overOdds: number;
    underOdds: number;
    status: 'live' | 'upcoming' | 'finished';
    time: string;
    sport: string;
    homeLogoUrl: string;
    awayLogoUrl: string;
    league?: string;
    currentTotal?: number;
  };
  onBet: (betType: string, team: string, odds: number, value?: number) => void;
  selectedBets?: Set<string>;
  onBetToggle?: (betKey: string, betData: { betType: string; team: string; odds: number; value?: number }) => void;
}

export default function EnhancedSportsCard({ 
  game, 
  onBet, 
  selectedBets = new Set(), 
  onBetToggle 
}: EnhancedSportsCardProps) {
  const [overUnderValue, setOverUnderValue] = useState(game.overUnder);
  const [showSlider, setShowSlider] = useState(false);
  const { soundEnabled } = useGameStore();
  const isLive = game.status === 'live';
  
  // Calculate house edge (typically 4.5-10% for sportsbooks)
  const calculateHouseEdge = (odds: number) => {
    const impliedProb = odds > 0 ? 100 / (odds + 100) : Math.abs(odds) / (Math.abs(odds) + 100);
    return ((1 - impliedProb) * 100).toFixed(1);
  };

  // Calculate odds based on slider value
  const calculateSliderOdds = (baseOdds: number, difference: number) => {
    const adjustment = difference * 15; // Each 0.5 point changes odds by ~15
    return Math.round(baseOdds + adjustment);
  };

  const overOddsAdjusted = calculateSliderOdds(game.overOdds, (overUnderValue - game.overUnder) * 2);
  const underOddsAdjusted = calculateSliderOdds(game.underOdds, (game.overUnder - overUnderValue) * 2);

  const getScoreLabel = () => {
    switch (game.sport.toLowerCase()) {
      case 'mlb':
      case 'college baseball':
        return 'runs';
      case 'nhl':
        return 'goals';
      case 'soccer':
        return 'goals';
      default:
        return 'points';
    }
  };

  const handleBetClick = async (betType: string, team: string, odds: number, value?: number) => {
    const betKey = `${game.id}-${betType}-${team.replace(/\s+/g, '')}`;
    
    // Play click sound
    if (soundEnabled) {
      await soundManager.play('click');
    }
    
    // Handle bet toggle logic
    if (onBetToggle) {
      onBetToggle(betKey, { betType, team, odds, value });
    } else {
      // Fallback to original onBet function
      onBet(betType, team, odds, value);
    }
  };

  const isBetSelected = (betType: string, team: string) => {
    const betKey = `${game.id}-${betType}-${team.replace(/\s+/g, '')}`;
    return selectedBets.has(betKey);
  };

  const getBetButtonClasses = (betType: string, team: string, baseClasses: string) => {
    const isSelected = isBetSelected(betType, team);
    const selectedClasses = isSelected 
      ? 'ring-2 ring-cyan-400 bg-cyan-600/30 shadow-lg shadow-cyan-400/50 border-cyan-400/50' 
      : '';
    return `${baseClasses} ${selectedClasses} transition-all duration-200`;
  };

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
          {game.league && (
            <span className="text-xs text-cyan-400 font-bold">{game.league}</span>
          )}
        </div>
        <div className="flex items-center space-x-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>{game.time}</span>
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-3 mb-4">
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
                <p className="text-gray-400 text-xs">{game.awayScore} {getScoreLabel()}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <motion.button
              onClick={() => handleBetClick('moneyline', game.awayTeam, game.awayOdds)}
              className={getBetButtonClasses(
                'moneyline', 
                game.awayTeam, 
                'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold text-white min-w-[60px]'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {game.awayOdds > 0 ? '+' : ''}{game.awayOdds}
            </motion.button>
            <span className="text-xs text-gray-500">H.E: {calculateHouseEdge(game.awayOdds)}%</span>
          </div>
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
                <p className="text-gray-400 text-xs">{game.homeScore} {getScoreLabel()}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            <motion.button
              onClick={() => handleBetClick('moneyline', game.homeTeam, game.homeOdds)}
              className={getBetButtonClasses(
                'moneyline', 
                game.homeTeam, 
                'px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs font-bold text-white min-w-[60px]'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {game.homeOdds > 0 ? '+' : ''}{game.homeOdds}
            </motion.button>
            <span className="text-xs text-gray-500">H.E: {calculateHouseEdge(game.homeOdds)}%</span>
          </div>
        </div>
      </div>

      {/* Over/Under Section */}
      <div className="border-t border-gray-600/30 pt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-3 h-3 text-cyan-400" />
            <span className="text-xs text-gray-400 font-medium">TOTAL {getScoreLabel().toUpperCase()}</span>
            {isLive && game.currentTotal && (
              <span className="text-xs text-cyan-400">({game.currentTotal} live)</span>
            )}
          </div>
          <button
            onClick={() => setShowSlider(!showSlider)}
            className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {showSlider ? 'Hide' : 'Adjust'}
          </button>
        </div>

        {showSlider && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setOverUnderValue(Math.max(0.5, overUnderValue - 0.5))}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                <Minus className="w-3 h-3" />
              </button>
              
              <div className="flex-1">
                <input
                  type="range"
                  min="0.5"
                  max={game.overUnder + 20}
                  step="0.5"
                  value={overUnderValue}
                  onChange={(e) => setOverUnderValue(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
                />
              </div>
              
              <button
                onClick={() => setOverUnderValue(overUnderValue + 0.5)}
                className="p-1 bg-gray-700 hover:bg-gray-600 rounded"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="text-center">
              <span className="text-sm font-bold text-white">{overUnderValue} {getScoreLabel()}</span>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <motion.button
            onClick={() => handleBetClick('over', `Over ${overUnderValue}`, overOddsAdjusted, overUnderValue)}
            className={getBetButtonClasses(
              'over',
              `Over ${overUnderValue}`,
              'p-2 bg-green-600/20 border border-green-500/30 hover:bg-green-600/30 rounded text-xs font-bold text-green-400'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <div>OVER {overUnderValue}</div>
              <div>{overOddsAdjusted > 0 ? '+' : ''}{overOddsAdjusted}</div>
              <div className="text-xs text-gray-400">H.E: {calculateHouseEdge(overOddsAdjusted)}%</div>
            </div>
          </motion.button>
          
          <motion.button
            onClick={() => handleBetClick('under', `Under ${overUnderValue}`, underOddsAdjusted, overUnderValue)}
            className={getBetButtonClasses(
              'under',
              `Under ${overUnderValue}`,
              'p-2 bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 rounded text-xs font-bold text-red-400'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="text-center">
              <div>UNDER {overUnderValue}</div>
              <div>{underOddsAdjusted > 0 ? '+' : ''}{underOddsAdjusted}</div>
              <div className="text-xs text-gray-400">H.E: {calculateHouseEdge(underOddsAdjusted)}%</div>
            </div>
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
