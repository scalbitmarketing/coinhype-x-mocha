
-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  wallet_balance DECIMAL(18,8) NOT NULL DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create game_sessions table
CREATE TABLE game_sessions_new (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  game_type TEXT NOT NULL,
  bet_amount DECIMAL(18,8) NOT NULL,
  result_data TEXT, -- JSON data for game-specific results
  payout_amount DECIMAL(18,8) DEFAULT 0.0,
  is_win BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create crypto_transactions table
CREATE TABLE crypto_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit', 'withdrawal', 'bet', 'win'
  amount DECIMAL(18,8) NOT NULL,
  transaction_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_game_sessions_new_user_id ON game_sessions_new(user_id);
CREATE INDEX idx_game_sessions_new_game_type ON game_sessions_new(game_type);
CREATE INDEX idx_game_sessions_new_created_at ON game_sessions_new(created_at);
CREATE INDEX idx_crypto_transactions_user_id ON crypto_transactions(user_id);
CREATE INDEX idx_crypto_transactions_type ON crypto_transactions(transaction_type);
CREATE INDEX idx_crypto_transactions_status ON crypto_transactions(status);
