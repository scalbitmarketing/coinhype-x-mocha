
CREATE TABLE app_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT NOT NULL UNIQUE,
  auth_provider TEXT NOT NULL DEFAULT 'manual', -- 'manual', 'google'
  auth_provider_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
