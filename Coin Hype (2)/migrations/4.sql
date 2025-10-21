
-- Create referrals table for tracking referral relationships
CREATE TABLE referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  commission_earned_lamports INTEGER NOT NULL DEFAULT 0,
  commission_earned_sol REAL NOT NULL DEFAULT 0.0,
  total_referred_losses_lamports INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral_codes table for managing referral codes
CREATE TABLE referral_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL UNIQUE,
  referral_code TEXT NOT NULL UNIQUE,
  total_referrals INTEGER NOT NULL DEFAULT 0,
  total_commission_lamports INTEGER NOT NULL DEFAULT 0,
  total_commission_sol REAL NOT NULL DEFAULT 0.0,
  commission_rate REAL NOT NULL DEFAULT 0.10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create referral_commissions table for tracking individual commission payments
CREATE TABLE referral_commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  referrer_user_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  game_session_id TEXT NOT NULL,
  loss_amount_lamports INTEGER NOT NULL,
  commission_amount_lamports INTEGER NOT NULL,
  commission_rate REAL NOT NULL,
  paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX idx_referrals_referred ON referrals(referred_user_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referral_codes_user ON referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON referral_codes(referral_code);
CREATE INDEX idx_referral_commissions_referrer ON referral_commissions(referrer_user_id);
