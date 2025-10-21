/**
 * Game Configuration - All multipliers and game constants
 * No hardcoded magic numbers - everything centralized here
 */

// House edge applied to all games (1% = 0.99 return)
export const HOUSE_EDGE = 0.01;
export const HOUSE_RETURN = 1 - HOUSE_EDGE;

// Dice Game Configuration
export const DICE_CONFIG = {
  MIN_TARGET: 1.01,
  MAX_TARGET: 99,
  BASE_MULTIPLIER: 99, // 99 / under for fair odds
  HOUSE_RETURN,
  calculateMultiplier: (under: number) => (99 / under) * HOUSE_RETURN,
  calculateWin: (roll: number, under: number) => roll < under
};

// Crash Game Configuration  
export const CRASH_CONFIG = {
  MIN_MULTIPLIER: 1.01,
  MAX_MULTIPLIER: 1000,
  BASE_CONSTANT: 0.01,
  RANGE_CONSTANT: 99.99,
  HOUSE_RETURN,
  calculateMultiplier: (roll: number) => {
    if (roll >= 100) roll = 99.99;
    return Math.max(1.01, 0.01 + (99.99 / (100 - roll)));
  }
};

// Mines Game Configuration
export const MINES_CONFIG = {
  GRID_SIZE: 25,
  MIN_MINES: 1,
  MAX_MINES: 24,
  BASE_MULTIPLIER: 1.15,
  HOUSE_RETURN,
  calculateMultiplier: (gemsRevealed: number) => Math.pow(1.15, gemsRevealed) * HOUSE_RETURN,
  calculateTileIndex: (roll: number) => Math.floor(roll * 25 / 100)
};

// Plinko Game Configuration
export const PLINKO_CONFIG = {
  LANES: 15, // 0-14 lanes
  HOUSE_RETURN,
  MULTIPLIERS: {
    HIGH_RISK: [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000],
    MEDIUM_RISK: [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110],
    LOW_RISK: [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16]
  },
  calculateLane: (roll: number) => Math.floor((roll / 100) * 15),
  getMultiplier: (riskLevel: number, lane: number) => {
    const risks = ['HIGH_RISK', 'MEDIUM_RISK', 'LOW_RISK'];
    const multipliers = PLINKO_CONFIG.MULTIPLIERS[risks[riskLevel] as keyof typeof PLINKO_CONFIG.MULTIPLIERS];
    return multipliers[lane] * HOUSE_RETURN;
  }
};

// Slots Game Configuration
export const SLOTS_CONFIG = {
  REELS: 3,
  SYMBOLS: 10, // 0-9 symbols
  HOUSE_RETURN,
  SYMBOL_MULTIPLIERS: [2, 3, 4, 5, 10, 15, 25, 50, 100, 500],
  PAYOUTS: {
    THREE_OF_KIND: (symbolIndex: number) => SLOTS_CONFIG.SYMBOL_MULTIPLIERS[symbolIndex] * HOUSE_RETURN,
    TWO_OF_KIND: (symbolIndex: number) => SLOTS_CONFIG.SYMBOL_MULTIPLIERS[symbolIndex] * 0.3 * HOUSE_RETURN,
    NO_MATCH: 0
  },
  calculateReel: (roll: number, reelIndex: number) => {
    const seed = roll * (13 + reelIndex * 7); // Different seed per reel
    return Math.floor(seed % 10);
  }
};

// Roulette Game Configuration
export const ROULETTE_CONFIG = {
  NUMBERS: 37, // 0-36 (European)
  HOUSE_RETURN,
  PAYOUTS: {
    STRAIGHT: 35 * HOUSE_RETURN, // Single number
    RED_BLACK: 2 * HOUSE_RETURN,
    EVEN_ODD: 2 * HOUSE_RETURN,
    HIGH_LOW: 2 * HOUSE_RETURN,
    DOZEN: 3 * HOUSE_RETURN,
    COLUMN: 3 * HOUSE_RETURN
  },
  RED_NUMBERS: [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36],
  calculateNumber: (roll: number) => Math.floor(roll % 37),
  getColor: (number: number) => {
    if (number === 0) return 'green';
    return ROULETTE_CONFIG.RED_NUMBERS.includes(number) ? 'red' : 'black';
  }
};

// Blackjack Game Configuration
export const BLACKJACK_CONFIG = {
  HOUSE_RETURN,
  PAYOUTS: {
    BLACKJACK: 2.5 * HOUSE_RETURN,
    WIN: 2 * HOUSE_RETURN,
    PUSH: 1, // Return bet
    LOSE: 0
  },
  CARD_VALUES: {
    'A': 11,
    'K': 10, 'Q': 10, 'J': 10,
    '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2
  }
};

// Poker Game Configuration
export const POKER_CONFIG = {
  HOUSE_RETURN,
  HAND_MULTIPLIERS: {
    'Royal Flush': 250 * HOUSE_RETURN,
    'Straight Flush': 50 * HOUSE_RETURN,
    'Four of a Kind': 25 * HOUSE_RETURN,
    'Full House': 9 * HOUSE_RETURN,
    'Flush': 6 * HOUSE_RETURN,
    'Straight': 4 * HOUSE_RETURN,
    'Three of a Kind': 3 * HOUSE_RETURN,
    'Two Pair': 2 * HOUSE_RETURN,
    'Jacks or Better': 1 * HOUSE_RETURN,
    'High Card': 0
  }
};

// Jackpot Configuration
export const JACKPOT_CONFIG = {
  WIN_THRESHOLD: 20000, // 2% chance (20,000 / 1,000,000)
  PAYOUT_PERCENTAGE: 0.7, // 70% of jackpot pool
  MIN_JACKPOT: 100, // Minimum jackpot amount
  calculateWin: (roll: number) => roll < 20000,
  calculatePayout: (jackpotPool: number) => jackpotPool * 0.7
};

// Coin Flip Configuration
export const COINFLIP_CONFIG = {
  HOUSE_RETURN,
  PAYOUT: 2 * HOUSE_RETURN,
  calculateWin: (roll: number, choice: 'heads' | 'tails') => {
    const result = roll < 50 ? 'heads' : 'tails';
    return choice === result;
  }
};

// Rock Paper Scissors Configuration
export const RPS_CONFIG = {
  HOUSE_RETURN,
  PAYOUTS: {
    WIN: 3 * HOUSE_RETURN, // Higher payout for 1/3 odds
    TIE: 1, // Return bet
    LOSE: 0
  }
};

// Financial Constants
export const FINANCIAL_CONFIG = {
  LAMPORTS_PER_SOL: 1000000000, // 1 billion lamports per SOL
  CENTS_PER_DOLLAR: 100,
  PRECISION_MULTIPLIER: 100, // For 2 decimal places
  
  // Convert display amount to integer (lamports/cents)
  toInteger: (displayAmount: number, isSOL: boolean = false) => {
    const multiplier = isSOL ? FINANCIAL_CONFIG.LAMPORTS_PER_SOL : FINANCIAL_CONFIG.CENTS_PER_DOLLAR;
    return Math.floor(displayAmount * multiplier);
  },
  
  // Convert integer back to display amount
  toDisplay: (integerAmount: number, isSOL: boolean = false) => {
    const multiplier = isSOL ? FINANCIAL_CONFIG.LAMPORTS_PER_SOL : FINANCIAL_CONFIG.CENTS_PER_DOLLAR;
    return integerAmount / multiplier;
  },
  
  // Calculate payout with no rounding errors
  calculatePayout: (betInteger: number, multiplier: number) => {
    return Math.floor(betInteger * multiplier);
  }
};
