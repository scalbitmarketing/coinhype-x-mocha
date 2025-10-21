import { Hono } from 'hono';

// Define Env interface for this module
interface Env {
  THE_ODDS_API_KEY: string;
  ODDS_WIDGET_ACCESS_KEY: string;
  SPORTSGAMESODDS_API_KEY?: string;
  DB: D1Database;
}

const sports = new Hono<{ Bindings: Env }>();

// Enhanced cache with error recovery
const sportsCache = new Map<string, { data: any; timestamp: number; error?: boolean }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Cache for odds data (shorter cache since odds change frequently)
const oddsCache = new Map<string, { data: any; timestamp: number; error?: boolean }>();
const ODDS_CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function isValidCache(cacheEntry: { data: any; timestamp: number; error?: boolean } | undefined, duration: number): boolean {
  if (!cacheEntry) return false;
  const age = Date.now() - cacheEntry.timestamp;
  
  // Use shorter cache for errors
  if (cacheEntry.error) {
    return age < (duration / 5); // 1/5th the normal cache time for errors
  }
  
  return age < duration;
}

// Enhanced retry mechanism with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CoinHype-Sports-API/1.0',
          ...options.headers,
        },
      });
      
      if (response.ok) {
        return response;
      }
      
      // Log specific error codes
      console.warn(`API request failed (attempt ${attempt + 1}): ${response.status} ${response.statusText}`);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      lastError = new Error(`Server error: ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Network error (attempt ${attempt + 1}):`, error);
    }
    
    // Exponential backoff: wait 1s, then 2s, then 4s
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError!;
}

// Data validation and cleaning functions
function validateSportsData(data: any[]): any[] {
  return data.filter(sport => {
    return sport && 
           typeof sport.key === 'string' && 
           typeof sport.title === 'string' && 
           sport.key.length > 0 && 
           sport.title.length > 0;
  }).map(sport => ({
    id: sport.key,
    name: sport.title,
    group: sport.group || 'Unknown',
    description: sport.description || sport.title,
    active: Boolean(sport.active),
    hasOutrights: Boolean(sport.has_outrights)
  }));
}

function validateGamesData(data: any[]): any[] {
  return data.filter(game => {
    return game && 
           typeof game.id === 'string' && 
           typeof game.home_team === 'string' && 
           typeof game.away_team === 'string' &&
           game.home_team.length > 0 &&
           game.away_team.length > 0 &&
           game.home_team !== game.away_team; // Ensure teams are different
  }).map(game => {
    // Clean and validate team names
    const homeTeam = game.home_team.trim();
    const awayTeam = game.away_team.trim();
    
    // Validate commence time
    let commenceTime = game.commence_time;
    try {
      const date = new Date(commenceTime);
      if (isNaN(date.getTime())) {
        commenceTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default to 24h from now
      }
    } catch {
      commenceTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    // Process odds with validation
    const getBestOdds = (marketKey: string) => {
      if (!game.bookmakers || !Array.isArray(game.bookmakers)) {
        return [];
      }
      
      const allOdds: any[] = [];
      
      game.bookmakers.forEach((bookmaker: any) => {
        if (!bookmaker.markets || !Array.isArray(bookmaker.markets)) return;
        
        const market = bookmaker.markets.find((m: any) => m.key === marketKey);
        if (market && market.outcomes && Array.isArray(market.outcomes)) {
          market.outcomes.forEach((outcome: any) => {
            if (outcome.name && typeof outcome.price === 'number') {
              allOdds.push({
                bookmaker: bookmaker.title || 'Unknown',
                name: outcome.name,
                price: outcome.price,
                point: outcome.point || null
              });
            }
          });
        }
      });
      
      return allOdds;
    };

    const h2hOdds = getBestOdds('h2h');
    const spreadOdds = getBestOdds('spreads');  
    const totalOdds = getBestOdds('totals');

    return {
      id: game.id,
      sportKey: game.sport_key || 'unknown',
      commenceTime,
      homeTeam,
      awayTeam,
      bookmakers: (game.bookmakers || []).map((bm: any) => ({
        key: bm.key || 'unknown',
        title: bm.title || 'Unknown Bookmaker',
        lastUpdate: bm.last_update || new Date().toISOString()
      })),
      odds: {
        h2h: h2hOdds,
        spreads: spreadOdds,
        totals: totalOdds
      },
      // Best odds for quick access with fallbacks
      bestOdds: {
        homeWin: h2hOdds.find((o: any) => o.name === homeTeam)?.price || -110,
        awayWin: h2hOdds.find((o: any) => o.name === awayTeam)?.price || -110,
        homeSpread: spreadOdds.find((o: any) => o.name === homeTeam)?.point || 0,
        awaySpread: spreadOdds.find((o: any) => o.name === awayTeam)?.point || 0,
        overUnder: totalOdds.length > 0 ? totalOdds[0]?.point || 45.5 : 45.5
      },
      // Add data quality indicators
      dataQuality: {
        hasOdds: h2hOdds.length > 0,
        hasSpreads: spreadOdds.length > 0,
        hasTotals: totalOdds.length > 0,
        bookmakerCount: (game.bookmakers || []).length,
        lastUpdated: new Date().toISOString()
      }
    };
  });
}

// Get list of available sports
sports.get('/sports', async (c) => {
  try {
    const cacheKey = 'sports_list';
    const cached = sportsCache.get(cacheKey);
    
    if (isValidCache(cached, CACHE_DURATION)) {
      return c.json({ sports: cached!.data, cached: true, error: cached!.error });
    }

    const apiKey = c.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY not configured');
    }

    const response = await fetchWithRetry(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}&all=false`
    );

    const rawData = await response.json() as any[];
    const validatedData = validateSportsData(rawData);
    
    // Filter to popular sports and add custom formatting
    const popularSports = [
      'americanfootball_nfl',
      'basketball_nba', 
      'baseball_mlb',
      'icehockey_nhl',
      'soccer_usa_mls',
      'americanfootball_ncaaf',
      'basketball_ncaab',
      'tennis_atp',
      'soccer_epl',
      'basketball_wnba'
    ];

    let filteredSports = validatedData.filter((sport: any) => 
      popularSports.includes(sport.id) && sport.active
    );

    // If we have very few sports, include more
    if (filteredSports.length < 4) {
      filteredSports = validatedData.filter((sport: any) => sport.active).slice(0, 8);
    }

    // Always ensure we have at least some sports
    if (filteredSports.length === 0) {
      filteredSports = [
        { id: 'americanfootball_nfl', name: 'NFL', group: 'American Football', description: 'National Football League', active: true, hasOutrights: false },
        { id: 'basketball_nba', name: 'NBA', group: 'Basketball', description: 'National Basketball Association', active: true, hasOutrights: false },
        { id: 'baseball_mlb', name: 'MLB', group: 'Baseball', description: 'Major League Baseball', active: true, hasOutrights: false },
        { id: 'icehockey_nhl', name: 'NHL', group: 'Ice Hockey', description: 'National Hockey League', active: true, hasOutrights: false }
      ];
    }

    // Cache the result
    sportsCache.set(cacheKey, { data: filteredSports, timestamp: Date.now(), error: false });

    return c.json({ 
      sports: filteredSports,
      cached: false,
      dataQuality: {
        totalSports: rawData.length,
        validSports: validatedData.length,
        filteredSports: filteredSports.length,
        lastUpdated: new Date().toISOString()
      },
      quotaInfo: {
        remaining: response.headers.get('x-requests-remaining'),
        used: response.headers.get('x-requests-used'),
        lastCost: response.headers.get('x-requests-last')
      }
    });
  } catch (error: any) {
    console.error('Error fetching sports:', error);
    
    // Cache error with shorter duration
    const mockSports = [
      { id: 'americanfootball_nfl', name: 'NFL', group: 'American Football', description: 'National Football League', active: true, hasOutrights: false },
      { id: 'basketball_nba', name: 'NBA', group: 'Basketball', description: 'National Basketball Association', active: true, hasOutrights: false },
      { id: 'baseball_mlb', name: 'MLB', group: 'Baseball', description: 'Major League Baseball', active: true, hasOutrights: false },
      { id: 'icehockey_nhl', name: 'NHL', group: 'Ice Hockey', description: 'National Hockey League', active: true, hasOutrights: false }
    ];
    
    sportsCache.set('sports_list', { data: mockSports, timestamp: Date.now(), error: true });
    
    return c.json({ 
      sports: mockSports, 
      error: error.message, 
      cached: false,
      fallback: true 
    });
  }
});

// Get odds for a specific sport
sports.get('/odds/:sportKey', async (c) => {
  try {
    const sportKey = c.req.param('sportKey');
    const region = c.req.query('region') || 'us';
    const markets = c.req.query('markets') || 'h2h,spreads,totals';
    
    const cacheKey = `odds_${sportKey}_${region}_${markets}`;
    const cached = oddsCache.get(cacheKey);
    
    if (isValidCache(cached, ODDS_CACHE_DURATION)) {
      return c.json({ games: cached!.data, cached: true, error: cached!.error });
    }

    const apiKey = c.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY not configured');
    }

    const response = await fetchWithRetry(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=${region}&markets=${markets}&oddsFormat=american&dateFormat=iso`
    );

    const rawData = await response.json() as any[];
    const validatedGames = validateGamesData(rawData);

    // If we have very few games, try to get more or provide fallback
    if (validatedGames.length === 0) {
      const fallbackGames = [
        {
          id: `mock_game_${Date.now()}`,
          sportKey,
          commenceTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          homeTeam: 'Home Team',
          awayTeam: 'Away Team',
          bookmakers: [{ key: 'draftkings', title: 'DraftKings', lastUpdate: new Date().toISOString() }],
          odds: { h2h: [], spreads: [], totals: [] },
          bestOdds: { homeWin: -110, awayWin: -110, homeSpread: -3.5, awaySpread: 3.5, overUnder: 45.5 },
          dataQuality: {
            hasOdds: false,
            hasSpreads: false,
            hasTotals: false,
            bookmakerCount: 0,
            lastUpdated: new Date().toISOString()
          }
        }
      ];
      
      oddsCache.set(cacheKey, { data: fallbackGames, timestamp: Date.now(), error: true });
      
      return c.json({ 
        games: fallbackGames,
        cached: false,
        fallback: true,
        error: 'No live games available, showing sample data'
      });
    }

    // Cache the result
    oddsCache.set(cacheKey, { data: validatedGames, timestamp: Date.now(), error: false });

    return c.json({ 
      games: validatedGames,
      cached: false,
      dataQuality: {
        totalGames: rawData.length,
        validGames: validatedGames.length,
        gamesWithOdds: validatedGames.filter(g => g.dataQuality.hasOdds).length,
        lastUpdated: new Date().toISOString()
      },
      quotaInfo: {
        remaining: response.headers.get('x-requests-remaining'),
        used: response.headers.get('x-requests-used'),
        lastCost: response.headers.get('x-requests-last')
      }
    });
  } catch (error: any) {
    console.error('Error fetching odds:', error);
    
    // Provide meaningful fallback data
    const mockGames = [
      {
        id: `fallback_game_${Date.now()}`,
        sportKey: c.req.param('sportKey'),
        commenceTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Team A',
        awayTeam: 'Team B',
        bookmakers: [{ key: 'sample', title: 'Sample Bookmaker', lastUpdate: new Date().toISOString() }],
        odds: { h2h: [], spreads: [], totals: [] },
        bestOdds: { homeWin: -110, awayWin: -110, homeSpread: -3.5, awaySpread: 3.5, overUnder: 45.5 },
        dataQuality: {
          hasOdds: false,
          hasSpreads: false,
          hasTotals: false,
          bookmakerCount: 0,
          lastUpdated: new Date().toISOString()
        }
      }
    ];
    
    oddsCache.set(`odds_${c.req.param('sportKey')}_us_h2h`, { data: mockGames, timestamp: Date.now(), error: true });
    
    return c.json({ 
      games: mockGames, 
      error: error.message, 
      cached: false,
      fallback: true 
    });
  }
});

// Enhanced scores endpoint with better error handling
sports.get('/scores/:sportKey', async (c) => {
  try {
    const sportKey = c.req.param('sportKey');
    const daysFrom = c.req.query('daysFrom') || '1';
    
    const cacheKey = `scores_${sportKey}_${daysFrom}`;
    const cached = sportsCache.get(cacheKey);
    
    if (isValidCache(cached, CACHE_DURATION)) {
      return c.json({ games: cached!.data, cached: true });
    }

    const apiKey = c.env.THE_ODDS_API_KEY;
    if (!apiKey) {
      throw new Error('THE_ODDS_API_KEY not configured');
    }

    const response = await fetchWithRetry(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=${daysFrom}&dateFormat=iso`
    );

    const data = await response.json() as any[];
    
    // Validate and transform scores data
    const transformedGames = data.filter(game => 
      game && game.id && game.home_team && game.away_team
    ).map((game: any) => ({
      id: game.id,
      sportKey: game.sport_key || sportKey,
      sportTitle: game.sport_title || 'Unknown Sport',
      commenceTime: game.commence_time || new Date().toISOString(),
      completed: Boolean(game.completed),
      homeTeam: game.home_team.trim(),
      awayTeam: game.away_team.trim(),
      scores: Array.isArray(game.scores) ? game.scores : [],
      lastUpdate: game.last_update || new Date().toISOString()
    }));

    // Cache the result
    sportsCache.set(cacheKey, { data: transformedGames, timestamp: Date.now() });

    return c.json({ 
      games: transformedGames,
      cached: false,
      quotaInfo: {
        remaining: response.headers.get('x-requests-remaining'),
        used: response.headers.get('x-requests-used'),
        lastCost: response.headers.get('x-requests-last')
      }
    });
  } catch (error: any) {
    console.error('Error fetching scores:', error);
    return c.json({ games: [], error: error.message, cached: false });
  }
});

// Health check endpoint
sports.get('/health', async (c) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    cache: {
      sportsEntries: sportsCache.size,
      oddsEntries: oddsCache.size
    },
    api: {
      configured: !!c.env.THE_ODDS_API_KEY
    }
  };
  
  return c.json(health);
});

// Clear cache endpoint (for admin use)
sports.post('/cache/clear', async (c) => {
  sportsCache.clear();
  oddsCache.clear();
  return c.json({ 
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
});

// Refresh specific sport data (force refresh)
sports.post('/refresh/:sportKey', async (c) => {
  const sportKey = c.req.param('sportKey');
  
  // Clear related cache entries
  const cacheKeys = Array.from(oddsCache.keys()).filter(key => key.includes(sportKey));
  cacheKeys.forEach(key => oddsCache.delete(key));
  
  return c.json({ 
    message: `Refreshed data for ${sportKey}`,
    timestamp: new Date().toISOString(),
    clearedCacheEntries: cacheKeys.length
  });
});

export default sports;
