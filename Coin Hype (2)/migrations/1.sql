
CREATE TABLE user_wallets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX idx_user_wallets_wallet_address ON user_wallets(wallet_address);

CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  transaction_signature TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win'
  amount_lamports INTEGER NOT NULL,
  amount_sol REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  game_session_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_wallet_address ON transactions(wallet_address);
CREATE INDEX idx_transactions_signature ON transactions(transaction_signature);
CREATE INDEX idx_transactions_game_session ON transactions(game_session_id);

CREATE TABLE user_balances (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  balance_lamports INTEGER NOT NULL DEFAULT 0,
  balance_sol REAL NOT NULL DEFAULT 0.0,
  total_deposited_lamports INTEGER NOT NULL DEFAULT 0,
  total_withdrawn_lamports INTEGER NOT NULL DEFAULT 0,
  total_wagered_lamports INTEGER NOT NULL DEFAULT 0,
  total_won_lamports INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_balances_user_id ON user_balances(user_id);

CREATE TABLE game_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL, -- 'dice', 'crash', etc.
  bet_amount_lamports INTEGER NOT NULL,
  bet_amount_sol REAL NOT NULL,
  result_data TEXT, -- JSON data for game-specific results
  payout_lamports INTEGER DEFAULT 0,
  payout_sol REAL DEFAULT 0.0,
  is_win BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX idx_game_sessions_game_type ON game_sessions(game_type);
