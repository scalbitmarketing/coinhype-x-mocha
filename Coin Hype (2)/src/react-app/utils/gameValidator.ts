/**
 * Client-side game validation utilities
 * These functions help validate game inputs and ensure data integrity
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateBetAmount(
  amount: number, 
  balance: number, 
  isSOL: boolean = false
): ValidationResult {
  const minBet = isSOL ? 0.001 : 0.01;
  const maxBet = isSOL ? 10 : 1000;
  
  if (amount < minBet) {
    return { 
      valid: false, 
      error: `Minimum bet is ${isSOL ? '◎' : '$'}${minBet}` 
    };
  }
  
  if (amount > maxBet) {
    return { 
      valid: false, 
      error: `Maximum bet is ${isSOL ? '◎' : '$'}${maxBet}` 
    };
  }
  
  if (amount > balance) {
    return { 
      valid: false, 
      error: 'Insufficient balance' 
    };
  }
  
  return { valid: true };
}

export function validateDiceTarget(target: number): ValidationResult {
  if (target < 1.01 || target > 99) {
    return { 
      valid: false, 
      error: 'Target must be between 1.01 and 99' 
    };
  }
  
  return { valid: true };
}

export function validateCrashMultiplier(multiplier: number): ValidationResult {
  if (multiplier < 1.01 || multiplier > 1000) {
    return { 
      valid: false, 
      error: 'Multiplier must be between 1.01x and 1000x' 
    };
  }
  
  return { valid: true };
}

export function validateMinesCount(mineCount: number): ValidationResult {
  if (mineCount < 1 || mineCount > 24) {
    return { 
      valid: false, 
      error: 'Mine count must be between 1 and 24' 
    };
  }
  
  return { valid: true };
}

export function validatePlinkoRisk(riskLevel: number): ValidationResult {
  if (![0, 1, 2].includes(riskLevel)) {
    return { 
      valid: false, 
      error: 'Invalid risk level' 
    };
  }
  
  return { valid: true };
}

export function validateWalletAddress(address: string): ValidationResult {
  // Basic Solana address validation (base58, 32-44 characters)
  const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  if (!address || !solanaAddressRegex.test(address)) {
    return { 
      valid: false, 
      error: 'Invalid Solana wallet address' 
    };
  }
  
  return { valid: true };
}

export function sanitizeNumericInput(value: string, decimals: number = 8): number {
  // Remove any non-numeric characters except decimal point
  const cleaned = value.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parseFloat(parts[0] + '.' + parts.slice(1).join(''));
  }
  
  // Limit decimal places
  if (parts.length === 2 && parts[1].length > decimals) {
    return parseFloat(parts[0] + '.' + parts[1].substring(0, decimals));
  }
  
  return parseFloat(cleaned) || 0;
}

export function formatCurrency(amount: number, isSOL: boolean = false): string {
  const symbol = isSOL ? '◎' : '$';
  const decimals = isSOL ? 4 : 2;
  return `${symbol}${amount.toFixed(decimals)}`;
}

export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMultiplier(value: number, decimals: number = 2): string {
  return `${value.toFixed(decimals)}x`;
}

export function calculateHouseEdge(game: string): number {
  const houseEdges: { [key: string]: number } = {
    dice: 0.01,      // 1%
    crash: 0.01,     // 1%
    mines: 0.03,     // 3%
    plinko: 0.02,    // 2%
    slots: 0.05,     // 5%
    roulette: 0.027, // 2.7% (European)
    blackjack: 0.005,// 0.5%
    poker: 0.02,     // 2%
    coinflip: 0.02,  // 2%
    rps: 0.02,       // 2%
    crossroads: 0.03,// 3%
    scratchoff: 0.1  // 10%
  };
  
  return houseEdges[game] || 0.02; // Default 2%
}

export function calculateMaxPayout(betAmount: number, game: string): number {
  const maxMultipliers: { [key: string]: number } = {
    dice: 99,        // 99x at 1% target
    crash: 1000,     // 1000x max
    mines: 100,      // ~100x theoretical max
    plinko: 1000,    // 1000x max on extreme slots
    slots: 500,      // 500x for jackpot symbol
    roulette: 35,    // 35:1 straight up
    blackjack: 2.5,  // 2.5:1 for blackjack
    poker: 250,      // 250:1 for royal flush
    coinflip: 1.96,  // ~2x with house edge
    rps: 2.94,       // ~3x with house edge
    crossroads: 3,   // 3x max
    scratchoff: 10   // 10x max
  };
  
  const maxMultiplier = maxMultipliers[game] || 10;
  return betAmount * maxMultiplier;
}
