import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Trophy, Users, TrendingUp, Star, Zap, Target, GraduationCap, Home, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router';
import BalanceDisplay from '@/react-app/components/BalanceDisplay';
import EnhancedSportsCard from '@/react-app/components/EnhancedSportsCard';

import { useSolana } from '@/react-app/providers/SolanaProvider';
import { useGameStore } from '@/react-app/stores/gameStore';
import EnhancedSoundManager from '@/react-app/utils/enhancedSounds';

const soundManager = new EnhancedSoundManager();

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  homeOdds: number;
  awayOdds: number;
  homeSpread?: number;
  awaySpread?: number;
  homeSpreadOdds?: number;
  awaySpreadOdds?: number;
  overUnder: number;
  overOdds: number;
  underOdds: number;
  status: 'live' | 'upcoming' | 'finished';
  time: string;
  sport: string;
  league?: string;
  homeLogoUrl: string;
  awayLogoUrl: string;
  currentTotal?: number;
}

interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  stats: Record<string, number>;
  image: string;
  age?: number;
  height?: string;
  weight?: string;
}

interface PlayerProp {
  id: string;
  type: string;
  line: number;
  overOdds: number;
  underOdds: number;
  description: string;
}

const SPORTS_TABS = [
  { id: 'live', name: 'Live', icon: Zap, color: 'text-red-400', apiSport: null },
  { id: 'americanfootball_nfl', name: 'NFL', icon: Users, color: 'text-blue-400', apiSport: 'americanfootball_nfl' },
  { id: 'basketball_nba', name: 'NBA', icon: Trophy, color: 'text-orange-400', apiSport: 'basketball_nba' },
  { id: 'baseball_mlb', name: 'MLB', icon: Target, color: 'text-green-400', apiSport: 'baseball_mlb' },
  { id: 'soccer_epl', name: 'Soccer', icon: Star, color: 'text-yellow-400', apiSport: 'soccer_epl' },
  { id: 'icehockey_nhl', name: 'NHL', icon: Target, color: 'text-cyan-400', apiSport: 'icehockey_nhl' },
  { id: 'basketball_ncaab', name: 'College', icon: GraduationCap, color: 'text-purple-400', apiSport: 'basketball_ncaab' },
];

export default function SportsPage() {
  const navigate = useNavigate();
  const { balance, refreshBalance } = useSolana();
  const { balance: demoBalance, placeBet, soundEnabled } = useGameStore();
  const [activeTab, setActiveTab] = useState('americanfootball_nfl');
  const [games, setGames] = useState<Game[]>([
    {
      id: "nfl-mock-1",
      homeTeam: "Dallas Cowboys",
      awayTeam: "New York Giants",
      homeOdds: -180,
      awayOdds: 150,
      homeSpread: -3.5,
      awaySpread: 3.5,
      homeSpreadOdds: -110,
      awaySpreadOdds: -110,
      overUnder: 47.5,
      overOdds: -105,
      underOdds: -115,
      status: 'live' as const,
      time: "Live - Q2 10:45",
      sport: "NFL",
      league: "National Football League",
      homeLogoUrl: "https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/cowboys-logo.png",
      awayLogoUrl: "https://mocha-cdn.com/019a03c8-927d-7b47-8386-6b32d1946c8e/giants-logo.png",
      homeScore: 14,
      awayScore: 7
    },
    {
      id: "nfl-mock-2",
      homeTeam: "Kansas City Chiefs",
      awayTeam: "Buffalo Bills",
      homeOdds: -125,
      awayOdds: 105,
      homeSpread: -2.5,
      awaySpread: 2.5,
      homeSpreadOdds: -110,
      awaySpreadOdds: -110,
      overUnder: 54.5,
      overOdds: -110,
      underOdds: -110,
      status: 'upcoming' as const,
      time: "Sun 4:25 PM",
      sport: "NFL",
      league: "National Football League",
      homeLogoUrl: "https://via.placeholder.com/64/E31837/FFB81C?text=KC",
      awayLogoUrl: "https://via.placeholder.com/64/00338D/C60C30?text=BUF"
    }
  ]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [playerProps, setPlayerProps] = useState<PlayerProp[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [placingBet, setPlacingBet] = useState(false);
  const [selectedBets, setSelectedBets] = useState<Set<string>>(new Set());
  const [parlayBets, setParlayBets] = useState<Array<{ 
    gameId: string; 
    betType: string;
    team: string; 
    odds: number;
    value?: number;
    betKey: string;
  }>>([]);

  // Fetch games for active sport
  useEffect(() => {
    console.log('Effect triggered, activeTab:', activeTab);
    if (activeTab === 'live') {
      // Fetch all live games
      fetchLiveGames();
    } else {
      const sport = SPORTS_TABS.find(tab => tab.id === activeTab)?.apiSport;
      console.log('Found sport for tab:', sport);
      if (sport) {
        fetchGamesForSport(sport);
      } else {
        // Fallback: set loading to false if no sport found
        setLoading(false);
      }
    }
  }, [activeTab]);

  // Force initial load after component mounts
  useEffect(() => {
    console.log('Component mounted, forcing initial data fetch');
    fetchGamesForSport('americanfootball_nfl');
  }, []);

  // Search players when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchPlayers(searchQuery);
    } else {
      setPlayers([]);
      setSelectedPlayer(null);
      setPlayerProps([]);
    }
  }, [searchQuery]);

  const fetchLiveGames = async () => {
    setLoading(true);
    try {
      // Fetch live games from multiple sports
      const sports = ['americanfootball_nfl', 'basketball_nba', 'baseball_mlb', 'soccer_epl'];
      const allGames: Game[] = [];
      
      for (const sport of sports) {
        try {
          const response = await fetch(`/api/sports/games/${sport}`);
          const data = await response.json();
          console.log(`Fetched ${sport} data:`, data);
          if (data.games) {
            // Get all games, then filter live games
            const sportGames = data.games;
            const liveGames = sportGames.filter((game: Game) => game.status === 'live');
            // If no live games, add first 2 games as upcoming
            if (liveGames.length === 0 && sportGames.length > 0) {
              allGames.push(...sportGames.slice(0, 2));
            } else {
              allGames.push(...liveGames);
            }
          }
        } catch (error) {
          console.error(`Failed to fetch ${sport} games:`, error);
        }
      }
      
      console.log('All fetched games:', allGames);
      setGames(allGames);
    } catch (error) {
      console.error('Failed to fetch live games:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGamesForSport = async (sport: string) => {
    setLoading(true);
    try {
      console.log(`Fetching games for sport: ${sport}`);
      const response = await fetch(`/api/sports/games/${sport}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received data for ${sport}:`, data);
      
      if (data.games && Array.isArray(data.games)) {
        setGames([...data.games]); // Force new array reference
        console.log(`Set ${data.games.length} games for ${sport}`);
      } else {
        console.warn('No games array found in response:', data);
        // Keep existing games if fetch fails
      }
    } catch (error) {
      console.error(`Failed to fetch ${sport} games:`, error);
      // Keep existing games if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const searchPlayers = async (query: string) => {
    try {
      const activeSport = SPORTS_TABS.find(tab => tab.id === activeTab)?.apiSport || 'all';
      const sportParam = activeSport === 'americanfootball_nfl' ? 'nfl' :
                          activeSport === 'basketball_nba' ? 'nba' :
                          activeSport === 'baseball_mlb' ? 'mlb' :
                          activeSport === 'soccer_epl' ? 'soccer' :
                          activeSport === 'basketball_ncaab' ? 'ncaab' : 'all';
      
      const response = await fetch(`/api/sports/players/search?q=${encodeURIComponent(query)}&sport=${sportParam}`);
      const data = await response.json();
      
      if (data.players) {
        setPlayers(data.players);
      }
    } catch (error) {
      console.error('Failed to search players:', error);
      setPlayers([]);
    }
  };

  const selectPlayer = async (player: Player) => {
    setSelectedPlayer(player);
    try {
      const response = await fetch(`/api/sports/players/${player.id}/props`);
      const data = await response.json();
      
      if (data.props) {
        setPlayerProps(data.props);
      }
    } catch (error) {
      console.error('Failed to fetch player props:', error);
      setPlayerProps([]);
    }
  };

  const handleBetToggle = (betKey: string, betData: { betType: string; team: string; odds: number; value?: number }) => {
    const { betType, team, odds, value } = betData;
    const gameId = betKey.split('-')[0];
    
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(betKey)) {
        // Remove bet
        newSet.delete(betKey);
        setParlayBets(prevBets => prevBets.filter(bet => bet.betKey !== betKey));
      } else {
        // Add bet (limit to 6)
        if (newSet.size < 6) {
          newSet.add(betKey);
          setParlayBets(prevBets => [...prevBets, {
            gameId,
            betType,
            team,
            odds,
            value,
            betKey
          }]);
        }
      }
      return newSet;
    });
  };

  const handleBet = (_betType: string, _team: string, _odds: number, _value?: number) => {
    // Legacy function - not used with new toggle system
  };

  const removeBet = (betKey: string) => {
    setSelectedBets(prev => {
      const newSet = new Set(prev);
      newSet.delete(betKey);
      return newSet;
    });
    setParlayBets(prev => prev.filter(bet => bet.betKey !== betKey));
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

  const placeParlayBet = async () => {
    if (parlayBets.length === 0 || placingBet) return;
    
    setPlacingBet(true);
    
    try {
      // Get bet amount from the input
      const betAmountInput = document.querySelector('input[type="number"]') as HTMLInputElement;
      const betAmount = parseFloat(betAmountInput?.value || '10');
      
      if (!betAmount || betAmount <= 0) {
        throw new Error('Invalid bet amount');
      }

      // Check balance
      const currentBalance = balance?.balanceSol || demoBalance;
      if (betAmount > currentBalance) {
        throw new Error('Insufficient balance');
      }

      // Place sports bet via API
      const response = await fetch('/api/sports/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bets: parlayBets,
          betAmount,
          parlayOdds: calculateParlayOdds()
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to place bet');
      }
      
      // Play success sound
      if (soundEnabled) {
        await soundManager.play(result.win ? 'win' : 'lose');
      }
      
      // Update balance
      if (balance?.balanceSol) {
        await refreshBalance();
      } else {
        placeBet(betAmount);
      }
      
      // Show result message
      alert(result.message);
      
      // Clear parlay and reset all selected buttons
      setParlayBets([]);
      setSelectedBets(new Set());
      
      // Reset input
      if (betAmountInput) {
        betAmountInput.value = '10';
      }
      
    } catch (error) {
      if (soundEnabled) {
        await soundManager.play('lose');
      }
      console.error('Failed to place bet:', error);
      alert(error instanceof Error ? error.message : 'Failed to place bet');
    } finally {
      setPlacingBet(false);
    }
  };

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
      {/* Header - Mobile Optimized */}
      <header className="p-3 sm:p-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/lobby')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
          
          {/* Center Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            <div className="text-lg sm:text-xl font-cursive font-bold gradient-text">
              Coin Hype
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <BalanceDisplay />
          </div>
        </div>
        
        {/* Sports Title Row */}
        <div className="mt-3 flex items-center justify-center space-x-2">
          <Trophy className="w-5 h-5 text-cyan-400" />
          <h1 className="text-base sm:text-lg font-bold text-white">Sports Betting</h1>
        </div>

        {/* Search Bar */}
        <div className="mt-4 max-w-md mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search players (LeBron, Brady, etc.)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
            />
          </div>
          
          {/* Enhanced Player Search Results */}
          {players.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-gray-800/95 backdrop-blur-sm border border-gray-600 rounded-lg mt-2 max-h-80 overflow-y-auto z-50 shadow-2xl">
              <div className="p-2 border-b border-gray-600/50">
                <div className="text-xs text-gray-400 font-medium">PLAYERS ({players.length})</div>
              </div>
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => selectPlayer(player)}
                  className="w-full p-4 hover:bg-gray-700/50 transition-all flex items-center space-x-4 text-left border-b border-gray-700/30 last:border-b-0"
                >
                  <div className="relative">
                    <img 
                      src={player.image} 
                      alt={player.name}
                      className="w-12 h-12 rounded-full ring-2 ring-gray-600"
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{player.name}</div>
                    <div className="text-gray-400 text-xs">{player.team} • {player.position} • {player.sport}</div>
                    {player.age && player.height && (
                      <div className="text-gray-500 text-xs mt-1">{player.age}yrs • {player.height} • {player.weight}</div>
                    )}
                    {player.stats && (
                      <div className="text-xs text-cyan-400 mt-1 font-medium">
                        {player.sport === 'NBA' && `${player.stats.points}pts ${player.stats.rebounds}reb ${player.stats.assists}ast`}
                        {player.sport === 'NFL' && player.position === 'QB' && `${player.stats.passingYards}yds ${player.stats.touchdowns}td ${player.stats.interceptions}int`}
                        {player.sport === 'NFL' && player.position === 'RB' && `${player.stats.rushingYards}yds ${player.stats.rushingTds}td`}
                        {player.sport === 'NFL' && player.position === 'WR' && `${player.stats.receivingYards}yds ${player.stats.receptions}rec ${player.stats.receivingTds}td`}
                        {player.sport === 'MLB' && `${player.stats.battingAvg?.toFixed(3) || '0.000'} ${player.stats.homeRuns}hr ${player.stats.rbi}rbi`}
                        {player.sport === 'NCAAB' && `${player.stats.points}pts ${player.stats.rebounds}reb ${player.stats.assists}ast`}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-400">
                    <Target className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Enhanced Selected Player Props */}
        {selectedPlayer && playerProps.length > 0 && (
          <div className="mb-6 glass-panel p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <img 
                    src={selectedPlayer.image} 
                    alt={selectedPlayer.name}
                    className="w-16 h-16 rounded-full ring-2 ring-cyan-400"
                  />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedPlayer.name}</h3>
                  <p className="text-gray-400">{selectedPlayer.team} • {selectedPlayer.position} • {selectedPlayer.sport}</p>
                  {selectedPlayer.age && selectedPlayer.height && (
                    <p className="text-gray-500 text-sm">{selectedPlayer.age} years old • {selectedPlayer.height} • {selectedPlayer.weight}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Available Props</div>
                  <div className="text-lg font-bold text-cyan-400">{playerProps.length}</div>
                </div>
                <button
                  onClick={() => {setSelectedPlayer(null); setPlayerProps([]);}}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Player Season Stats */}
            {selectedPlayer.stats && (
              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-3">2024 Season Stats</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {selectedPlayer.sport === 'NBA' && (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.points}</div>
                        <div className="text-xs text-gray-400">PPG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.rebounds}</div>
                        <div className="text-xs text-gray-400">RPG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.assists}</div>
                        <div className="text-xs text-gray-400">APG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.threePointers}</div>
                        <div className="text-xs text-gray-400">3PM</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{(selectedPlayer.stats.fieldGoalPct * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-400">FG%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.minutes}</div>
                        <div className="text-xs text-gray-400">MPG</div>
                      </div>
                    </>
                  )}
                  {selectedPlayer.sport === 'NFL' && selectedPlayer.position === 'QB' && (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.passingYards}</div>
                        <div className="text-xs text-gray-400">Pass Yds</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.touchdowns}</div>
                        <div className="text-xs text-gray-400">Pass TDs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.interceptions}</div>
                        <div className="text-xs text-gray-400">INTs</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.completionPct}%</div>
                        <div className="text-xs text-gray-400">CMP%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.qbRating}</div>
                        <div className="text-xs text-gray-400">QBR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.rushingYards}</div>
                        <div className="text-xs text-gray-400">Rush Yds</div>
                      </div>
                    </>
                  )}
                  {selectedPlayer.sport === 'MLB' && (
                    <>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.battingAvg?.toFixed(3)}</div>
                        <div className="text-xs text-gray-400">AVG</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.homeRuns}</div>
                        <div className="text-xs text-gray-400">HR</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.rbi}</div>
                        <div className="text-xs text-gray-400">RBI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.runs}</div>
                        <div className="text-xs text-gray-400">R</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.stolenBases}</div>
                        <div className="text-xs text-gray-400">SB</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{selectedPlayer.stats.ops?.toFixed(3)}</div>
                        <div className="text-xs text-gray-400">OPS</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {/* Enhanced Player Props Betting Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {playerProps.map((prop) => (
                <div key={prop.id} className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 rounded-xl p-4 border border-gray-600/30 hover:border-cyan-400/30 transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-medium text-gray-300">{prop.description}</div>
                    <div className="flex items-center space-x-1">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400">Live</span>
                    </div>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-xs text-gray-400 mb-1">O/U Line</div>
                    <div className="text-2xl font-bold text-white">{prop.line}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        handleBetToggle(
                          `player-${prop.id}-over`, 
                          { betType: 'Over', team: `${selectedPlayer.name} Over ${prop.line}`, odds: prop.overOdds, value: prop.line }
                        );
                        if (soundEnabled) soundManager.play('click');
                      }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        selectedBets.has(`player-${prop.id}-over`)
                          ? 'bg-green-600 text-white shadow-lg shadow-green-500/50 ring-2 ring-green-400 transform scale-105'
                          : 'bg-green-600/20 text-green-400 hover:bg-green-600/40 hover:scale-102'
                      }`}
                    >
                      <div>Over</div>
                      <div className="text-xs opacity-90">{prop.overOdds > 0 ? '+' : ''}{prop.overOdds}</div>
                    </button>
                    <button
                      onClick={() => {
                        handleBetToggle(
                          `player-${prop.id}-under`, 
                          { betType: 'Under', team: `${selectedPlayer.name} Under ${prop.line}`, odds: prop.underOdds, value: prop.line }
                        );
                        if (soundEnabled) soundManager.play('click');
                      }}
                      className={`px-3 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 ${
                        selectedBets.has(`player-${prop.id}-under`)
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/50 ring-2 ring-red-400 transform scale-105'
                          : 'bg-red-600/20 text-red-400 hover:bg-red-600/40 hover:scale-102'
                      }`}
                    >
                      <div>Under</div>
                      <div className="text-xs opacity-90">{prop.underOdds > 0 ? '+' : ''}{prop.underOdds}</div>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sports Navigation */}
        <div className="mb-6">
          <div className="grid grid-cols-3 md:flex md:space-x-1 gap-1 md:gap-0 bg-gray-800/50 rounded-lg p-1">
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
        </div>

        {/* Enhanced Live Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-panel p-4 text-center hover:bg-gray-800/30 transition-all">
            <div className="flex items-center justify-center mb-2">
              <Home className="w-6 h-6 text-cyan-400" />
              <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <p className="text-xl font-bold text-white">{loading ? '...' : games.length}</p>
            <p className="text-xs text-gray-400">Available Games</p>
            <p className="text-xs text-cyan-400 mt-1">{loading ? 'Loading...' : 'Live Odds'}</p>
          </div>
          <div className="glass-panel p-4 text-center hover:bg-gray-800/30 transition-all">
            <Users className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{parlayBets.length}<span className="text-sm text-gray-400">/6</span></p>
            <p className="text-xs text-gray-400">Parlay Picks</p>
            <p className="text-xs text-green-400 mt-1">{6 - parlayBets.length} slots left</p>
          </div>
          <div className="glass-panel p-4 text-center hover:bg-gray-800/30 transition-all">
            <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">+{calculateParlayOdds()}</p>
            <p className="text-xs text-gray-400">Parlay Odds</p>
            <p className="text-xs text-purple-400 mt-1">Fair odds with edge</p>
          </div>
          <div className="glass-panel p-4 text-center hover:bg-gray-800/30 transition-all">
            <Target className="w-6 h-6 text-red-400 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">5.0%</p>
            <p className="text-xs text-gray-400">House Edge</p>
            <p className="text-xs text-red-400 mt-1">Industry standard</p>
          </div>
        </div>

        {/* Sports Market Overview */}
        <div className="mb-6 glass-panel p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Sports Markets</span>
            </h3>
            <div className="flex items-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                <span className="text-gray-400">Moneyline</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                <span className="text-gray-400">Spread</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                <span className="text-gray-400">Over/Under</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></div>
                <span className="text-gray-400">Player Props</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">Total Markets</div>
              <div className="text-lg font-bold text-white">{games.length * 3 + (selectedPlayer ? playerProps.length : 0)}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Live Games</div>
              <div className="text-lg font-bold text-green-400">{games.filter(g => g.status === 'live').length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Upcoming</div>
              <div className="text-lg font-bold text-cyan-400">{games.filter(g => g.status === 'upcoming').length}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">Player Props</div>
              <div className="text-lg font-bold text-yellow-400">{selectedPlayer ? playerProps.length : 'Search Player'}</div>
            </div>
          </div>
          
          {/* Debug info */}
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div>Loading: {loading.toString()}</div>
              <div>Games: {games.length}</div>
              <div>Active Tab: {activeTab}</div>
              <div>API Ready: {games.length > 0 ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Games Grid */}
          <div className="xl:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-400">Loading games...</span>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No games available for {activeTab}</p>
                <p className="text-gray-500 text-sm mt-2">Using mock data while API key is being configured</p>
                <div className="mt-4 text-xs text-gray-600 space-y-1">
                  <p>Debug: Loading={loading.toString()}, Games count={games.length}</p>
                  <p>Active tab: {activeTab}</p>
                  <button 
                    onClick={() => fetchGamesForSport('americanfootball_nfl')}
                    className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 rounded text-white text-xs"
                  >
                    Force Reload NFL Games
                  </button>
                </div>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {games.map((game) => (
                  <motion.div key={game.id} variants={itemVariants}>
                    <EnhancedSportsCard 
                      game={game} 
                      onBet={handleBet}
                      selectedBets={selectedBets}
                      onBetToggle={handleBetToggle}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Enhanced Parlay Sidebar */}
          <div className="xl:col-span-1">
            <div className="glass-panel p-4 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <span>Live Bet Slip</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              </div>

              {parlayBets.length === 0 ? (
                <div className="text-center py-6">
                  <Trophy className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Add bets to your slip</p>
                  <p className="text-gray-500 text-xs mt-1">Click any odds to get started</p>
                  <div className="mt-3 text-xs text-gray-500 space-y-1">
                    <div className="flex justify-between">
                      <span>Single Bet:</span>
                      <span>2x-500x payouts</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Parlay (2-6):</span>
                      <span>Up to 1000x+</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Player Props:</span>
                      <span>Search above</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    {parlayBets.map((bet, index) => (
                      <div key={bet.betKey} className="flex items-center justify-between p-2 bg-gray-700/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs bg-cyan-600 text-white px-1.5 py-0.5 rounded">{index + 1}</span>
                            <span className="text-sm text-white font-medium">{bet.team}</span>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs text-gray-400">({bet.betType})</span>
                            {bet.value && (
                              <span className="text-xs text-cyan-400">@ {bet.value}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-bold text-cyan-400">
                            {bet.odds > 0 ? '+' : ''}{bet.odds}
                          </span>
                          <button
                            onClick={() => removeBet(bet.betKey)}
                            className="text-xs text-red-400 hover:text-red-300 w-4 h-4 flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-600/30 pt-3 space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Bet Amount ($)</label>
                      <input 
                        type="number" 
                        defaultValue="10" 
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{parlayBets.length}-Team Parlay:</span>
                        <span className="text-cyan-400 font-bold">+{calculateParlayOdds()}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">Potential Payout:</span>
                        <span className="text-green-400 font-bold">${calculateParlayPayout().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-500">House Edge:</span>
                        <span className="text-red-400">5.0%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={placeParlayBet}
                        disabled={placingBet || parlayBets.length === 0}
                        className="py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 rounded-lg text-white font-bold transition-all text-sm disabled:cursor-not-allowed"
                      >
                        {placingBet ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Placing...</span>
                          </div>
                        ) : (
                          'Place Bet'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setParlayBets([]);
                          setSelectedBets(new Set());
                        }}
                        className="py-2.5 border border-gray-600 rounded-lg text-gray-400 hover:text-white hover:border-gray-500 transition-all text-sm"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    <div className="mt-2 p-2 bg-gray-800/50 rounded text-xs text-gray-400 space-y-1">
                      <div className="flex justify-between">
                        <span>House Edge:</span>
                        <span className="text-red-400">5.0%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Max Payout:</span>
                        <span className="text-green-400">$50,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
