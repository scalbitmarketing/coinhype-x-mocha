import z from "zod";

export const WalletSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  wallet_address: z.string(),
  is_primary: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const TransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  wallet_address: z.string(),
  transaction_signature: z.string(),
  transaction_type: z.enum(['deposit', 'withdrawal', 'bet', 'win']),
  amount_lamports: z.number(),
  amount_sol: z.number(),
  status: z.enum(['pending', 'confirmed', 'failed']),
  game_session_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UserBalanceSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  balance_lamports: z.number(),
  balance_sol: z.number(),
  total_deposited_lamports: z.number(),
  total_withdrawn_lamports: z.number(),
  total_wagered_lamports: z.number(),
  total_won_lamports: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const GameSessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  game_type: z.string(),
  bet_amount_lamports: z.number(),
  bet_amount_sol: z.number(),
  result_data: z.string().nullable(),
  payout_lamports: z.number(),
  payout_sol: z.number(),
  is_win: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const DepositRequestSchema = z.object({
  transactionSignature: z.string(),
});

export const DiceGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  target: z.number().min(1.01).max(99),
});

export const CrashGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  cashoutMultiplier: z.number().min(1.01).max(1000),
});

export const MinesGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  mineCount: z.number().min(1).max(24),
  gemsFound: z.number().min(0).max(24),
  hitMine: z.boolean(),
});

export const PlinkoGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  ballCount: z.number().min(1).max(50),
  riskLevel: z.number().min(0).max(2),
  results: z.array(z.object({
    slot: z.number().min(0).max(14),
    multiplier: z.number().min(0).max(1000),
  })),
});

export const SlotsGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  reels: z.array(z.number().min(0).max(7)).length(3),
});

export const RouletteGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  bets: z.array(z.object({
    type: z.string(),
    amount: z.number().min(0.001),
    numbers: z.array(z.number()).optional(),
    multiplier: z.number().min(1),
  })),
  winningNumber: z.number().min(0).max(36),
});

export const BlackjackGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  playerCards: z.array(z.object({
    suit: z.enum(['♠', '♥', '♦', '♣']),
    value: z.string(),
    numValue: z.number(),
  })),
  dealerCards: z.array(z.object({
    suit: z.enum(['♠', '♥', '♦', '♣']),
    value: z.string(),
    numValue: z.number(),
  })),
  outcome: z.enum(['win', 'lose', 'push', 'blackjack']),
});

export const PokerGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  finalCards: z.array(z.object({
    suit: z.enum(['♠', '♥', '♦', '♣']),
    value: z.string(),
    numValue: z.number(),
  })).length(5),
  handRank: z.string(),
});

export const ConnectWalletRequestSchema = z.object({
  walletAddress: z.string(),
});

export const CoinFlipGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  playerChoice: z.enum(['heads', 'tails']),
});

export const RpsGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  playerChoice: z.enum(['rock', 'paper', 'scissors']),
  computerChoice: z.enum(['rock', 'paper', 'scissors']),
});

export const CrossroadsGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  selectedDirection: z.enum(['north', 'south', 'east', 'west']),
  resultDirection: z.enum(['north', 'south', 'east', 'west']),
});

export const ScratchOffGameRequestSchema = z.object({
  betAmountSol: z.number().min(0.001).max(10),
  cells: z.array(z.object({
    id: z.number(),
    symbol: z.string(),
    multiplier: z.number(),
    isScratched: z.boolean(),
  })),
  winningSymbol: z.string(),
  matches: z.number(),
});

export type WalletType = z.infer<typeof WalletSchema>;
export type TransactionType = z.infer<typeof TransactionSchema>;
export type UserBalanceType = z.infer<typeof UserBalanceSchema>;
export type GameSessionType = z.infer<typeof GameSessionSchema>;
export type DepositRequest = z.infer<typeof DepositRequestSchema>;
export type DiceGameRequest = z.infer<typeof DiceGameRequestSchema>;
export type CrashGameRequest = z.infer<typeof CrashGameRequestSchema>;
export type MinesGameRequest = z.infer<typeof MinesGameRequestSchema>;
export type PlinkoGameRequest = z.infer<typeof PlinkoGameRequestSchema>;
export type SlotsGameRequest = z.infer<typeof SlotsGameRequestSchema>;
export type RouletteGameRequest = z.infer<typeof RouletteGameRequestSchema>;
export type BlackjackGameRequest = z.infer<typeof BlackjackGameRequestSchema>;
export type PokerGameRequest = z.infer<typeof PokerGameRequestSchema>;
export type ConnectWalletRequest = z.infer<typeof ConnectWalletRequestSchema>;
export type CoinFlipGameRequest = z.infer<typeof CoinFlipGameRequestSchema>;
export type RpsGameRequest = z.infer<typeof RpsGameRequestSchema>;
export type CrossroadsGameRequest = z.infer<typeof CrossroadsGameRequestSchema>;
export type ScratchOffGameRequest = z.infer<typeof ScratchOffGameRequestSchema>;

export interface SolanaBalance {
  balanceLamports: number;
  balanceSol: number;
  totalDeposited: number;
  totalWithdrawn: number;
  totalWagered: number;
  totalWon: number;
}

export interface DiceGameResult {
  sessionId: string;
  roll: number;
  target: number;
  multiplier: number;
  win: boolean;
  betAmountSol: number;
  payoutSol: number;
  newBalanceSol: number;
}

// Sports Betting Types
export interface SportsGame {
  id: string;
  sportKey: string;
  sport?: string;
  league?: string;
  homeTeam: string;
  awayTeam: string;
  home_team?: string; // Legacy support
  away_team?: string; // Legacy support
  home_team_logo?: string;
  away_team_logo?: string;
  commenceTime: string;
  commence_time?: string; // Legacy support
  completed?: boolean;
  homeScore?: number;
  awayScore?: number;
  home_score?: number; // Legacy support
  away_score?: number; // Legacy support
  lastUpdate?: string;
  last_update?: string; // Legacy support
  bookmakers?: Bookmaker[];
  bookmaker_count?: number; // Legacy support
  odds?: {
    h2h: OddsOutcome[];
    spreads: OddsOutcome[];
    totals: OddsOutcome[];
    home_odds?: number; // Legacy support
    away_odds?: number; // Legacy support
    draw_odds?: number; // Legacy support
    home_spread?: number; // Legacy support
    away_spread?: number; // Legacy support
    total_over_under?: number; // Legacy support
  };
  bestOdds?: {
    homeWin: number | null;
    awayWin: number | null;
    homeSpread: number | null;
    awaySpread: number | null;
    overUnder: number | null;
  };
  // Additional fields for compatibility
  homeOdds?: number;
  awayOdds?: number;
  homeSpread?: number;
  awaySpread?: number;
  homeSpreadOdds?: number;
  awaySpreadOdds?: number;
  overUnder?: number;
  overOdds?: number;
  underOdds?: number;
  status?: 'live' | 'upcoming' | 'finished';
  time?: string;
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  currentTotal?: number;
}

export interface Bookmaker {
  key: string;
  title: string;
  lastUpdate: string;
  last_update?: string; // Legacy support
  markets?: Market[];
}

export interface Market {
  key: string;
  lastUpdate?: string;
  last_update?: string; // Legacy support
  outcomes: OddsOutcome[];
}

export interface OddsOutcome {
  name: string;
  price: number;
  point?: number;
  description?: string;
  bookmaker?: string;
}

export interface Sport {
  id: string;
  key?: string; // Legacy support
  name: string;
  title?: string; // Legacy support
  group: string;
  description: string;
  active: boolean;
  hasOutrights?: boolean;
  has_outrights?: boolean; // Legacy support
}

export interface Player {
  id: string;
  name: string;
  team: string;
  position: string;
  sport: string;
  stats: Record<string, number>;
  image: string;
  age?: number;
  height?: string;
  weight?: string;
}

export interface PlayerProp {
  id: string;
  type: string;
  line: number;
  overOdds: number;
  underOdds: number;
  description: string;
}
