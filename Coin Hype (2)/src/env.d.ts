/// <reference types="vite/client" />

declare global {
  interface Env {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    HOUSE_WALLET_PRIVATE_KEY: string;
    SOLANA_RPC_URL: string;
    MOCHA_USERS_SERVICE_API_KEY: string;
    MOCHA_USERS_SERVICE_API_URL: string;
    SPORTSGAMESODDS_API_KEY: string;
  }
}

export {};
