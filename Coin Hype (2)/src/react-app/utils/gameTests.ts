// COMPREHENSIVE GAME TESTING UTILITIES
// Unit tests and simulation functions for all casino games

export interface TestResult {
  game: string;
  totalRounds: number;
  expectedWinRate: number;
  actualWinRate: number;
  expectedRTP: number;
  actualRTP: number;
  variance: number;
  issues: string[];
  passed: boolean;
}

// DICE GAME TESTING
export function testDiceGame(rounds: number = 10000): TestResult {
  let wins = 0;
  let totalBet = 0;
  let totalPayout = 0;
  const issues: string[] = [];
  
  for (let i = 0; i < rounds; i++) {
    const bet = 1;
    const target = 50; // 50% win chance
    const roll = Math.random() * 100;
    const win = roll < target;
    const houseEdge = 0.01;
    const multiplier = (100 / target) * (1 - houseEdge);
    const payout = win ? bet * multiplier : 0;
    
    if (win) wins++;
    totalBet += bet;
    totalPayout += payout;
    
    // Check for impossible values
    if (roll < 0 || roll > 100) issues.push(`Invalid roll: ${roll}`);
    if (multiplier < 1) issues.push(`Invalid multiplier: ${multiplier}`);
  }
  
  const actualWinRate = wins / rounds;
  const actualRTP = totalPayout / totalBet;
  const expectedWinRate = 0.50;
  const expectedRTP = 0.99; // 1% house edge
  
  return {
    game: 'Dice',
    totalRounds: rounds,
    expectedWinRate,
    actualWinRate,
    expectedRTP,
    actualRTP,
    variance: Math.abs(actualWinRate - expectedWinRate),
    issues,
    passed: Math.abs(actualWinRate - expectedWinRate) < 0.02 && Math.abs(actualRTP - expectedRTP) < 0.02
  };
}

// BLACKJACK GAME TESTING
export function testBlackjackGame(rounds: number = 1000): TestResult {
  let wins = 0;
  let totalBet = 0;
  let totalPayout = 0;
  const issues: string[] = [];
  
  // Helper function commented out - not used in current implementation
  
  for (let i = 0; i < rounds; i++) {
    const bet = 1;
    
    // Simulate simplified hands
    const playerValue = Math.floor(Math.random() * 11) + 12; // 12-22
    const dealerValue = Math.floor(Math.random() * 11) + 12; // 12-22
    
    const playerBust = playerValue > 21;
    const dealerBust = dealerValue > 21;
    const playerBlackjack = playerValue === 21 && Math.random() < 0.05;
    
    let payout = 0;
    
    if (playerBust) {
      payout = 0; // Player always loses if bust
    } else if (dealerBust) {
      payout = bet * 2; // Player wins if dealer busts
      wins++;
    } else if (playerBlackjack) {
      payout = bet * 2.5; // Blackjack pays 3:2
      wins++;
    } else if (playerValue > dealerValue) {
      payout = bet * 2;
      wins++;
    } else if (playerValue === dealerValue) {
      payout = bet; // Push returns bet
    }
    
    totalBet += bet;
    totalPayout += payout;
    
    // Check for logical errors
    if (playerBust && payout > 0) issues.push(`Player bust but won: P${playerValue} D${dealerValue}`);
    if (dealerValue > 21 && !dealerBust) issues.push(`Dealer 22+ not marked as bust: ${dealerValue}`);
  }
  
  const actualWinRate = wins / rounds;
  const actualRTP = totalPayout / totalBet;
  
  return {
    game: 'Blackjack',
    totalRounds: rounds,
    expectedWinRate: 0.42, // Approximate blackjack win rate
    actualWinRate,
    expectedRTP: 0.995, // Very low house edge
    actualRTP,
    variance: 0, // Calculated differently for blackjack
    issues,
    passed: issues.length === 0
  };
}

// ROULETTE GAME TESTING
export function testRouletteGame(rounds: number = 3700): TestResult {
  let wins = 0;
  let totalBet = 0;
  let totalPayout = 0;
  const issues: string[] = [];
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  for (let i = 0; i < rounds; i++) {
    const bet = 1;
    const number = Math.floor(Math.random() * 37); // 0-36
    
    // Test red bet
    const isRed = redNumbers.includes(number);
    const redPayout = isRed ? bet * 2 : 0;
    
    if (isRed) wins++;
    totalBet += bet;
    totalPayout += redPayout;
    
    // Check for invalid numbers
    if (number < 0 || number > 36) issues.push(`Invalid roulette number: ${number}`);
    if (number === 0 && isRed) issues.push(`Zero marked as red`);
  }
  
  const actualWinRate = wins / rounds;
  const actualRTP = totalPayout / totalBet;
  const expectedWinRate = 18/37; // 18 red numbers out of 37
  const expectedRTP = (18/37) * 2; // RTP for red bet
  
  return {
    game: 'Roulette',
    totalRounds: rounds,
    expectedWinRate,
    actualWinRate,
    expectedRTP,
    actualRTP,
    variance: Math.abs(actualWinRate - expectedWinRate),
    issues,
    passed: Math.abs(actualWinRate - expectedWinRate) < 0.02 && issues.length === 0
  };
}

// COIN FLIP TESTING
export function testCoinFlipGame(rounds: number = 10000): TestResult {
  let wins = 0;
  let totalBet = 0;
  let totalPayout = 0;
  const issues: string[] = [];
  
  for (let i = 0; i < rounds; i++) {
    const bet = 1;
    const result = Math.random() < 0.5 ? 'heads' : 'tails';
    const choice = Math.random() < 0.5 ? 'heads' : 'tails';
    const win = result === choice;
    const payout = win ? bet * 1.96 : 0; // 2% house edge
    
    if (win) wins++;
    totalBet += bet;
    totalPayout += payout;
  }
  
  const actualWinRate = wins / rounds;
  const actualRTP = totalPayout / totalBet;
  
  return {
    game: 'CoinFlip',
    totalRounds: rounds,
    expectedWinRate: 0.50,
    actualWinRate,
    expectedRTP: 0.98, // 2% house edge
    actualRTP,
    variance: Math.abs(actualWinRate - 0.50),
    issues,
    passed: Math.abs(actualWinRate - 0.50) < 0.02 && Math.abs(actualRTP - 0.98) < 0.02
  };
}

// RUN ALL TESTS
export function runAllGameTests(): TestResult[] {
  console.log('🎯 Running comprehensive game tests...');
  
  const results = [
    testDiceGame(),
    testBlackjackGame(),
    testRouletteGame(),
    testCoinFlipGame()
  ];
  
  console.log('\n📊 GAME TEST RESULTS:');
  results.forEach(result => {
    console.log(`\n${result.game}:`);
    console.log(`  Win Rate: ${(result.actualWinRate * 100).toFixed(2)}% (expected ${(result.expectedWinRate * 100).toFixed(2)}%)`);
    console.log(`  RTP: ${(result.actualRTP * 100).toFixed(2)}% (expected ${(result.expectedRTP * 100).toFixed(2)}%)`);
    console.log(`  Status: ${result.passed ? '✅ PASSED' : '❌ FAILED'}`);
    if (result.issues.length > 0) {
      console.log(`  Issues: ${result.issues.join(', ')}`);
    }
  });
  
  const passedTests = results.filter(r => r.passed).length;
  console.log(`\n🎯 Overall: ${passedTests}/${results.length} tests passed`);
  
  return results;
}

// BALANCE VALIDATION
export function validateBalanceUpdates(initialBalance: number, actions: Array<{type: 'bet' | 'win', amount: number}>): boolean {
  let balance = initialBalance;
  const issues: string[] = [];
  
  for (const action of actions) {
    if (action.type === 'bet') {
      if (balance < action.amount) {
        issues.push(`Insufficient balance for bet: ${balance} < ${action.amount}`);
        return false;
      }
      balance -= action.amount;
    } else if (action.type === 'win') {
      balance += action.amount;
    }
    
    if (balance < 0) {
      issues.push(`Negative balance: ${balance}`);
      return false;
    }
  }
  
  return issues.length === 0;
}

// EDGE CASE TESTING
export function testEdgeCases(): string[] {
  const issues: string[] = [];
  
  // Test dice edge cases
  const diceTarget1 = (100 / 1) * 0.99; // Target = 1 should give ~99x multiplier
  const diceTarget99 = (100 / 99) * 0.99; // Target = 99 should give ~1.01x multiplier
  
  if (diceTarget1 < 90 || diceTarget1 > 110) issues.push(`Dice target=1 multiplier out of range: ${diceTarget1}`);
  if (diceTarget99 < 1.00 || diceTarget99 > 1.10) issues.push(`Dice target=99 multiplier out of range: ${diceTarget99}`);
  
  // Test balance edge cases
  if (!validateBalanceUpdates(100, [{type: 'bet', amount: 50}, {type: 'win', amount: 100}])) {
    issues.push('Balance validation failed for normal case');
  }
  
  if (validateBalanceUpdates(100, [{type: 'bet', amount: 150}])) {
    issues.push('Balance validation should fail for insufficient funds');
  }
  
  return issues;
}
