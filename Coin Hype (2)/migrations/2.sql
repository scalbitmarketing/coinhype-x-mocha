
-- Add leaderboard and user management tables
CREATE TABLE leaderboard_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  total_wagered_lamports INTEGER NOT NULL DEFAULT 0,
  total_won_lamports INTEGER NOT NULL DEFAULT 0,
  net_pnl_lamports INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  win_rate REAL NOT NULL DEFAULT 0.0,
  rank_position INTEGER NOT NULL DEFAULT 0,
  timeframe TEXT NOT NULL DEFAULT 'all',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE daily_bonuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  bonus_amount_lamports INTEGER NOT NULL,
  bonus_amount_sol REAL NOT NULL,
  claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  streak INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vip_status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL DEFAULT 0,
  total_deposited_lamports INTEGER NOT NULL DEFAULT 0,
  vip_bonuses_earned_lamports INTEGER NOT NULL DEFAULT 0,
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaderboard_cache_user_timeframe ON leaderboard_cache(user_id, timeframe);
CREATE INDEX idx_leaderboard_cache_rank ON leaderboard_cache(timeframe, rank_position);
CREATE INDEX idx_daily_bonuses_user_claimed ON daily_bonuses(user_id, claimed_at);
CREATE INDEX idx_vip_status_user ON vip_status(user_id);
