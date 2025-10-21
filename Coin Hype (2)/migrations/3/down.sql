
-- Drop indexes
DROP INDEX idx_crypto_transactions_status;
DROP INDEX idx_crypto_transactions_type;
DROP INDEX idx_crypto_transactions_user_id;
DROP INDEX idx_game_sessions_new_created_at;
DROP INDEX idx_game_sessions_new_game_type;
DROP INDEX idx_game_sessions_new_user_id;

-- Drop tables
DROP TABLE crypto_transactions;
DROP TABLE game_sessions_new;
DROP TABLE users;
