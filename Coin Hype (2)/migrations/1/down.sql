
DROP INDEX idx_game_sessions_game_type;
DROP INDEX idx_game_sessions_user_id;
DROP TABLE game_sessions;

DROP INDEX idx_user_balances_user_id;
DROP TABLE user_balances;

DROP INDEX idx_transactions_game_session;
DROP INDEX idx_transactions_signature;
DROP INDEX idx_transactions_wallet_address;
DROP INDEX idx_transactions_user_id;
DROP TABLE transactions;

DROP INDEX idx_user_wallets_wallet_address;
DROP INDEX idx_user_wallets_user_id;
DROP TABLE user_wallets;
