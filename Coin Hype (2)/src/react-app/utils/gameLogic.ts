import Big from 'big.js';

// Configure Big.js for precision
Big.RM = Big.roundHalfUp;
Big.DP = 8; // 8 decimal places for crypto precision

export interface DiceGameResult {
  roll: number;
  target: number;
  multiplier: number;
  win: boolean;
  betAmount: number;
  payout: number;
  newBalance: number;
}

export interface CrashGameResult {
  crashMultiplier: number;
  userCashout?: number;
  betAmount: number;
  payout: number;
  win: boolean;
  newBalance: number;
}

/**
 * Calculate dice game outcome with high precision
 * @param bet - Bet amount
 * @param target - Target number (1-99)
 * @param houseEdge - House edge percentage (default 1%)
 * @param currentBalance - Current wallet balance
 * @returns Dice game result
 */
export function calculateDiceOutcome(
  bet: number, 
  target: number, 
  houseEdge: number = 0.01,
  currentBalance: number
): DiceGameResult {
  // Generate random roll [0, 100)
  const roll = Math.random() * 100;
  const win = roll < target;
  
  // Calculate multiplier with house edge
  const targetProbability = new Big(target).div(100);
  const fairMultiplier = new Big(1).div(targetProbability);
  const multiplier = fairMultiplier.times(new Big(1).minus(houseEdge));
  
  // Calculate payout
  const betBig = new Big(bet);
  const balanceBig = new Big(currentBalance);
  
  let payout: Big;
  let newBalance: Big;
  
  if (win) {
    payout = betBig.times(multiplier);
    newBalance = balanceBig.minus(betBig).plus(payout);
  } else {
    payout = new Big(0);
    newBalance = balanceBig.minus(betBig);
  }
  
  return {
    roll: Math.round(roll * 100) / 100, // Round to 2 decimal places
    target,
    multiplier: parseFloat(multiplier.toFixed(2)),
    win,
    betAmount: bet,
    payout: parseFloat(payout.toFixed(8)),
    newBalance: parseFloat(newBalance.toFixed(8))
  };
}

/**
 * Generate crash multiplier from exponential distribution
 * @param lambda - Distribution parameter (default 0.04 for ~1% crash at 1x)
 * @returns Crash multiplier
 */
export function generateCrashMultiplier(lambda: number = 0.04): number {
  // Use exponential distribution: -ln(1-U)/λ + 1
  const u = Math.random();
  const multiplier = -Math.log(1 - u) / lambda + 1;
  
  // Cap at reasonable maximum
  return Math.min(multiplier, 1000);
}

/**
 * Calculate crash game outcome
 * @param bet - Bet amount
 * @param crashMultiplier - The multiplier where the game crashes
 * @param userCashout - User's cashout multiplier (undefined if didn't cash out)
 * @param currentBalance - Current wallet balance
 * @returns Crash game result
 */
export function calculateCrashOutcome(
  bet: number,
  crashMultiplier: number,
  userCashout: number | undefined,
  currentBalance: number
): CrashGameResult {
  const betBig = new Big(bet);
  const balanceBig = new Big(currentBalance);
  
  let win = false;
  let payout = new Big(0);
  
  if (userCashout && userCashout < crashMultiplier) {
    // User cashed out before crash
    win = true;
    payout = betBig.times(userCashout);
  }
  
  const newBalance = win 
    ? balanceBig.minus(betBig).plus(payout)
    : balanceBig.minus(betBig);
  
  return {
    crashMultiplier: Math.round(crashMultiplier * 100) / 100,
    userCashout,
    betAmount: bet,
    payout: parseFloat(payout.toFixed(8)),
    win,
    newBalance: parseFloat(newBalance.toFixed(8))
  };
}

/**
 * Validate bet amount
 * @param bet - Bet amount to validate
 * @param balance - Current balance
 * @param minBet - Minimum bet allowed
 * @param maxBet - Maximum bet allowed
 * @returns Validation result
 */
export function validateBet(
  bet: number, 
  balance: number, 
  minBet: number = 0.001, 
  maxBet: number = 100
): { valid: boolean; error?: string } {
  if (bet < minBet) {
    return { valid: false, error: `Minimum bet is ${minBet}` };
  }
  
  if (bet > maxBet) {
    return { valid: false, error: `Maximum bet is ${maxBet}` };
  }
  
  if (bet > balance) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  return { valid: true };
}

/**
 * Format currency with appropriate precision
 * @param amount - Amount to format
 * @param isSOL - Whether this is SOL (true) or demo currency (false)
 * @returns Formatted string
 */
export function formatCurrency(amount: number, isSOL: boolean = false): string {
  const symbol = isSOL ? '◎' : '$';
  const decimals = isSOL ? 4 : 2;
  return `${symbol}${amount.toFixed(decimals)}`;
}
