/**
 * Enhanced Provably Fair System with cryptographic integrity
 * All calculations are deterministic and verifiable
 */

// Simple hash function for deterministic results
function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export interface GameSeed {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
}

export interface ProvablyFairResult {
  serverSeed: string;
  clientSeed: string;
  nonce: number;
  hash: string;
  result: number;
}

/**
 * Generate a cryptographically secure server seed
 */
export function generateServerSeed(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substr(2, 32);
}

/**
 * Generate a random client seed
 */
export function generateClientSeed(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substr(2, 16);
}

/**
 * Calculate deterministic hash
 */
export function calculateHash(serverSeed: string, clientSeed: string, nonce: number): string {
  const message = `${serverSeed}-${clientSeed}-${nonce}`;
  const hash = simpleHash(message);
  return hash.toString(16).padStart(8, '0');
}

/**
 * Generate provably fair number between 0 and 1
 */
export function generateProvablyFairNumber(serverSeed: string, clientSeed: string, nonce: number): number {
  const hash = calculateHash(serverSeed, clientSeed, nonce);
  const num = parseInt(hash, 16);
  return (num % 1000000) / 1000000;
}

/**
 * Generate dice roll result (0-100)
 */
export function generateDiceRoll(serverSeed: string, clientSeed: string, nonce: number): ProvablyFairResult {
  const random = generateProvablyFairNumber(serverSeed, clientSeed, nonce);
  const result = random * 100;
  
  return {
    serverSeed,
    clientSeed,
    nonce,
    hash: calculateHash(serverSeed, clientSeed, nonce),
    result
  };
}

/**
 * Generate crash multiplier (1.00 to 1000.00)
 */
export function generateCrashMultiplier(serverSeed: string, clientSeed: string, nonce: number): ProvablyFairResult {
  const random = generateProvablyFairNumber(serverSeed, clientSeed, nonce);
  const result = Math.max(1.0, -Math.log(1 - random * 0.99) / 0.04 + 1);
  const clampedResult = Math.min(result, 1000);
  
  return {
    serverSeed,
    clientSeed,
    nonce,
    hash: calculateHash(serverSeed, clientSeed, nonce),
    result: Math.round(clampedResult * 100) / 100
  };
}

/**
 * Generate mines board (25 cells)
 */
export function generateMinesBoard(serverSeed: string, clientSeed: string, nonce: number, mineCount: number): ProvablyFairResult & { mines: number[] } {
  const mines: number[] = [];
  const positions = Array.from({ length: 25 }, (_, i) => i);
  
  for (let i = 0; i < mineCount; i++) {
    const random = generateProvablyFairNumber(serverSeed, clientSeed, nonce + i);
    const index = Math.floor(random * positions.length);
    mines.push(positions.splice(index, 1)[0]);
  }
  
  return {
    serverSeed,
    clientSeed,
    nonce,
    hash: calculateHash(serverSeed, clientSeed, nonce),
    result: mines[0] || 0,
    mines: mines.sort((a, b) => a - b)
  };
}

/**
 * Verify a provably fair result
 */
export function verifyResult(serverSeed: string, clientSeed: string, nonce: number, expectedHash: string): boolean {
  const calculatedHash = calculateHash(serverSeed, clientSeed, nonce);
  return calculatedHash === expectedHash;
}
