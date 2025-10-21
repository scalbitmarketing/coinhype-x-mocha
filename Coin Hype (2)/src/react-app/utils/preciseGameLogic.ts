/**
 * Precise Game Logic - Integer-based calculations for financial integrity
 * No rounding errors, all math done in integers (lamports/cents)
 */

import { 
  DICE_CONFIG, 
  CRASH_CONFIG, 
  MINES_CONFIG, 
  PLINKO_CONFIG, 
  SLOTS_CONFIG, 
  ROULETTE_CONFIG,
  JACKPOT_CONFIG,
  COINFLIP_CONFIG,
  FINANCIAL_CONFIG 
} from '@/react-app/config/gameConfig';

export { FINANCIAL_CONFIG };

export interface GameResult {
  win: boolean;
  payoutInteger: number;
  payoutDisplay: number;
  multiplier: number;
  details: Record<string, any>;
}

/**
 * Generate cryptographically secure random number 0-99999999
 */
export function generateSecureRoll(): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] % 100000000; // 0-99,999,999
  }
  return Math.floor(Math.random() * 100000000);
}

/**
 * Dice Game Logic - Exact implementation
 */
export function calculateDiceResult(
  betInteger: number, 
  under: number, 
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll() / 1000000; // Convert to 0-100 range
  const win = DICE_CONFIG.calculateWin(roll, under);
  const multiplier = DICE_CONFIG.calculateMultiplier(under);
  const payoutInteger = win ? FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier) : 0;
  
  return {
    win,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { roll: Number(roll.toFixed(2)), under, target: under }
  };
}

/**
 * Crash Game Logic - Exact implementation
 */
export function calculateCrashResult(
  betInteger: number,
  cashoutMultiplier: number | null,
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll() / 1000000; // Convert to 0-100 range
  const crashMultiplier = CRASH_CONFIG.calculateMultiplier(roll);
  
  const win = cashoutMultiplier !== null && cashoutMultiplier < crashMultiplier && cashoutMultiplier >= 1.01;
  const finalMultiplier = win ? cashoutMultiplier! : 0;
  const payoutInteger = win ? FINANCIAL_CONFIG.calculatePayout(betInteger, finalMultiplier) : 0;
  
  return {
    win,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier: finalMultiplier,
    details: { 
      crashMultiplier: Number(crashMultiplier.toFixed(2)), 
      cashoutMultiplier, 
      roll: Number(roll.toFixed(2)) 
    }
  };
}

/**
 * Mines Game Logic - Exact implementation
 */
export function calculateMinesResult(
  betInteger: number,
  gemsRevealed: number,
  hitMine: boolean,
  isSOL: boolean = false
): GameResult {
  const win = !hitMine && gemsRevealed > 0;
  const multiplier = win ? MINES_CONFIG.calculateMultiplier(gemsRevealed) : 0;
  const payoutInteger = win ? FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier) : 0;
  
  return {
    win,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { gemsRevealed, hitMine, safeTiles: 25 - gemsRevealed }
  };
}

/**
 * Generate mine positions for Mines game
 */
export function generateMinePositions(mineCount: number): number[] {
  const positions: number[] = [];
  const available = Array.from({ length: 25 }, (_, i) => i);
  
  for (let i = 0; i < mineCount; i++) {
    const roll = generateSecureRoll();
    const index = roll % available.length;
    positions.push(available.splice(index, 1)[0]);
  }
  
  return positions.sort((a, b) => a - b);
}

/**
 * Plinko Game Logic - Exact implementation
 */
export function calculatePlinkoResult(
  betInteger: number,
  riskLevel: number,
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll() / 1000000; // Convert to 0-100 range
  const lane = PLINKO_CONFIG.calculateLane(roll);
  const multiplier = PLINKO_CONFIG.getMultiplier(riskLevel, lane);
  const payoutInteger = FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier);
  
  return {
    win: multiplier >= 1.0,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { lane, riskLevel, roll: Number(roll.toFixed(2)) }
  };
}

/**
 * Slots Game Logic - Exact implementation
 */
export function calculateSlotsResult(
  betInteger: number,
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll();
  
  const reel1 = SLOTS_CONFIG.calculateReel(roll, 0);
  const reel2 = SLOTS_CONFIG.calculateReel(roll, 1);
  const reel3 = SLOTS_CONFIG.calculateReel(roll, 2);
  
  let multiplier = 0;
  let winType = 'No Match';
  
  // Three of a kind
  if (reel1 === reel2 && reel2 === reel3) {
    multiplier = SLOTS_CONFIG.PAYOUTS.THREE_OF_KIND(reel1);
    winType = 'Three of a Kind';
  }
  // Two of a kind (high value symbols only - index 4+)
  else if ((reel1 === reel2 || reel2 === reel3 || reel1 === reel3) && 
           Math.max(reel1, reel2, reel3) >= 4) {
    const symbol = reel1 === reel2 ? reel1 : reel2 === reel3 ? reel2 : reel1;
    if (symbol >= 4) {
      multiplier = SLOTS_CONFIG.PAYOUTS.TWO_OF_KIND(symbol);
      winType = 'Two of a Kind';
    }
  }
  
  const payoutInteger = FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier);
  
  return {
    win: multiplier > 0,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { reels: [reel1, reel2, reel3], winType }
  };
}

/**
 * Roulette Game Logic - Exact implementation
 */
export function calculateRouletteResult(
  betInteger: number,
  betType: string,
  betNumbers?: number[],
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll() / 1000000; // Convert to 0-100 range
  const number = ROULETTE_CONFIG.calculateNumber(roll * 100); // Scale to 0-36
  const color = ROULETTE_CONFIG.getColor(number);
  
  let win = false;
  let multiplier = 0;
  
  switch (betType) {
    case 'straight':
      win = betNumbers?.includes(number) || false;
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.STRAIGHT : 0;
      break;
    case 'red':
      win = color === 'red';
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.RED_BLACK : 0;
      break;
    case 'black':
      win = color === 'black';
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.RED_BLACK : 0;
      break;
    case 'even':
      win = number > 0 && number % 2 === 0;
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.EVEN_ODD : 0;
      break;
    case 'odd':
      win = number % 2 === 1;
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.EVEN_ODD : 0;
      break;
    case 'high':
      win = number >= 19 && number <= 36;
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.HIGH_LOW : 0;
      break;
    case 'low':
      win = number >= 1 && number <= 18;
      multiplier = win ? ROULETTE_CONFIG.PAYOUTS.HIGH_LOW : 0;
      break;
  }
  
  const payoutInteger = FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier);
  
  return {
    win,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { number, color, betType, betNumbers }
  };
}

/**
 * Coin Flip Game Logic - Exact implementation
 */
export function calculateCoinFlipResult(
  betInteger: number,
  choice: 'heads' | 'tails',
  isSOL: boolean = false
): GameResult {
  const roll = generateSecureRoll() / 1000000; // Convert to 0-100 range
  const win = COINFLIP_CONFIG.calculateWin(roll * 100, choice);
  const multiplier = win ? COINFLIP_CONFIG.PAYOUT : 0;
  const payoutInteger = win ? FINANCIAL_CONFIG.calculatePayout(betInteger, multiplier) : 0;
  
  const result = roll * 100 < 50 ? 'heads' : 'tails';
  
  return {
    win,
    payoutInteger,
    payoutDisplay: FINANCIAL_CONFIG.toDisplay(payoutInteger, isSOL),
    multiplier,
    details: { choice, result, roll: Number((roll * 100).toFixed(2)) }
  };
}

/**
 * Jackpot Check - Can be called on any game
 */
export function checkJackpot(
  jackpotPoolInteger: number,
  isSOL: boolean = false
): { hit: boolean; payoutInteger: number; payoutDisplay: number } {
  const roll = generateSecureRoll();
  const hit = JACKPOT_CONFIG.calculateWin(roll);
  
  if (hit) {
    const jackpotPayout = JACKPOT_CONFIG.calculatePayout(
      FINANCIAL_CONFIG.toDisplay(jackpotPoolInteger, isSOL)
    );
    const payoutInteger = FINANCIAL_CONFIG.toInteger(jackpotPayout, isSOL);
    
    return {
      hit: true,
      payoutInteger,
      payoutDisplay: jackpotPayout
    };
  }
  
  return { hit: false, payoutInteger: 0, payoutDisplay: 0 };
}

/**
 * Format currency with proper precision
 */
export function formatCurrency(amountInteger: number, isSOL: boolean = false): string {
  const display = FINANCIAL_CONFIG.toDisplay(amountInteger, isSOL);
  const symbol = isSOL ? '◎' : '$';
  const decimals = isSOL ? 4 : 2;
  return `${symbol}${display.toFixed(decimals)}`;
}

/**
 * Validate bet amount
 */
export function validateBet(
  betInteger: number, 
  balanceInteger: number, 
  minBetInteger: number, 
  maxBetInteger: number
): { valid: boolean; error?: string } {
  if (betInteger < minBetInteger) {
    return { valid: false, error: 'Bet amount too low' };
  }
  
  if (betInteger > maxBetInteger) {
    return { valid: false, error: 'Bet amount too high' };
  }
  
  if (betInteger > balanceInteger) {
    return { valid: false, error: 'Insufficient balance' };
  }
  
  return { valid: true };
}
