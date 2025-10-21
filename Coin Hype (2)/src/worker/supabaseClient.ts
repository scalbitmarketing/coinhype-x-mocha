import { createClient } from '@supabase/supabase-js';

export function createSupabaseClient(env: any) {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          wallet_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          wallet_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          wallet_balance?: number;
          updated_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_type: string;
          bet_amount: number;
          result_data: any;
          payout_amount: number;
          is_win: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          game_type: string;
          bet_amount: number;
          result_data: any;
          payout_amount: number;
          is_win: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_type?: string;
          bet_amount?: number;
          result_data?: any;
          payout_amount?: number;
          is_win?: boolean;
        };
      };
      crypto_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: 'deposit' | 'withdrawal' | 'bet' | 'win';
          amount: number;
          transaction_hash?: string;
          status: 'pending' | 'confirmed' | 'failed';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id: string;
          transaction_type: 'deposit' | 'withdrawal' | 'bet' | 'win';
          amount: number;
          transaction_hash?: string;
          status?: 'pending' | 'confirmed' | 'failed';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: 'deposit' | 'withdrawal' | 'bet' | 'win';
          amount?: number;
          transaction_hash?: string;
          status?: 'pending' | 'confirmed' | 'failed';
          updated_at?: string;
        };
      };
    };
  };
}
