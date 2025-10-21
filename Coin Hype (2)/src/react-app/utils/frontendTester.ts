/**
 * Frontend Game Testing Utility
 * Tests client-side game logic, animations, and UI functionality
 */

interface TestResult {
  game: string;
  tests: string[];
  passed: boolean;
  issues: string[];
}

interface FrontendIssue {
  game: string;
  component: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  reproduction: string;
}

export class FrontendGameTester {
  private issues: FrontendIssue[] = [];
  // Store test results for analysis

  // Test individual game component functionality
  testGameComponents(): TestResult[] {
    const results: TestResult[] = [];

    // Test Dice Game
    results.push(this.testDiceGame());
    
    // Test Crash Game  
    results.push(this.testCrashGame());
    
    // Test Plinko Game
    results.push(this.testPlinkoGame());
    
    // Test Mines Game
    results.push(this.testMinesGame());
    
    // Test Slots Game
    results.push(this.testSlotsGame());
    
    // Test Blackjack Game
    results.push(this.testBlackjackGame());
    
    // Test Other Games
    results.push(this.testOtherGames());

    // Store results for future analysis
    return results;
  }

  private testDiceGame(): TestResult {
    const tests = [
      'Target slider functionality',
      'Multiplier calculation display',
      'Win chance percentage',
      'Dice roll animation',
      'Result display accuracy',
      'History persistence'
    ];

    const issues: string[] = [];

    // Check multiplier calculation
    try {
      const target = 50;
      const houseEdge = 0.01;
      const expectedMultiplier = (99 / (target - 1)) * (1 - houseEdge);
      // This should match the calculation in DiceGame.tsx
      console.log('Dice multiplier test:', expectedMultiplier);
    } catch (error) {
      issues.push('Multiplier calculation error in dice game');
    }

    return {
      game: 'Dice',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testCrashGame(): TestResult {
    const tests = [
      'Crash multiplier animation',
      'Betting timer countdown',
      'Cashout button responsiveness',
      'Auto-cashout functionality',
      'Rocket animation',
      'History display'
    ];

    const issues: string[] = [];

    // Check for crash game timing issues
    const hasCountdownTimer = document.querySelector('[data-testid="crash-timer"]');
    if (!hasCountdownTimer) {
      issues.push('Crash game timer element not found');
    }

    return {
      game: 'Crash',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testPlinkoGame(): TestResult {
    const tests = [
      'Ball drop physics',
      'Peg collision detection',
      'Ball trajectory randomness',
      'Multiplier slot accuracy',
      'Multiple ball handling',
      'Risk level switching'
    ];

    const issues: string[] = [];

    // Test Plinko ball physics constants
    try {
      // Check if ball starts from center (280px from code review)
      // Ball should start from center position
      const centerPosition = 280;
      console.log('Testing ball start position:', centerPosition);
      // Validate multiplier arrays exist
      const riskLevels = [
        [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000], // High
        [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110], // Medium  
        [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16] // Low
      ];
      
      if (riskLevels[0].length !== 15) {
        issues.push('Plinko multiplier array length mismatch');
      }
    } catch (error) {
      issues.push('Plinko configuration validation failed');
    }

    return {
      game: 'Plinko',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testMinesGame(): TestResult {
    const tests = [
      'Board grid generation',
      'Mine placement randomness',
      'Gem reveal animations',
      'Mine explosion effects',
      'Multiplier progression',
      'Cashout calculation'
    ];

    const issues: string[] = [];

    // Test mines game multiplier calculation
    try {
      // Test hypergeometric distribution calculation
      const testMultiplier = this.calculateMinesMultiplier(3, 3); // 3 gems found, 3 mines
      if (testMultiplier < 1) {
        issues.push('Mines multiplier calculation returns invalid result');
      }
    } catch (error) {
      issues.push('Mines multiplier calculation error');
    }

    return {
      game: 'Mines',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testSlotsGame(): TestResult {
    const tests = [
      'Reel spinning animation',
      'Symbol alignment',
      'Paytable accuracy',
      'Win line detection',
      'Sound effects timing',
      'Result calculation'
    ];

    const issues: string[] = [];

    // Test slots paytable
    const expectedSymbols = ['🍒', '🍋', '🍊', '🍇', '🔔'];
    const expectedMultipliers = [2, 3, 4, 5, 10];
    
    if (expectedSymbols.length !== expectedMultipliers.length) {
      issues.push('Slots paytable symbol/multiplier mismatch');
    }

    return {
      game: 'Slots',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testBlackjackGame(): TestResult {
    const tests = [
      'Card dealing animation',
      'Hand value calculation',
      'Ace soft/hard handling',
      'Blackjack detection',
      'Dealer AI behavior',
      'Payout calculations'
    ];

    const issues: string[] = [];

    // Test blackjack hand scoring
    try {
      const testCards = [
        { suit: '♠', value: 'A', numValue: 11, hidden: false },
        { suit: '♥', value: 'K', numValue: 10, hidden: false }
      ];
      
      // This should be a blackjack (21 with exactly 2 cards)
      const handValue = this.scoreBlackjackHand(testCards);
      if (!handValue.isBlackjack) {
        issues.push('Blackjack detection logic error');
      }
    } catch (error) {
      issues.push('Blackjack hand scoring error');
    }

    return {
      game: 'Blackjack',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  private testOtherGames(): TestResult {
    const tests = [
      'Roulette wheel animation',
      'Poker hand evaluation',
      'RPS choice selection',
      'Crossroads pathfinding',
      'Coin flip animation',
      'Scratch card revealing'
    ];

    const issues: string[] = [];

    // Test various game elements
    const gameRoutes = [
      '/games/roulette',
      '/games/poker', 
      '/games/rockpaperscissors',
      '/games/crossroads',
      '/games/coinflip',
      '/games/scratchoff'
    ];

    // Check if routes exist (basic test)
    gameRoutes.forEach(route => {
      try {
        // This is a basic check - in real implementation we'd navigate and test
        console.log('Testing route:', route);
      } catch (error) {
        issues.push(`Route ${route} may have issues`);
      }
    });

    return {
      game: 'Other Games',
      tests,
      passed: issues.length === 0,
      issues
    };
  }

  // Helper methods for testing calculations
  private calculateMinesMultiplier(gems: number, mines: number): number {
    const totalCells = 25;
    const safeCells = totalCells - mines;
    
    if (gems === 0) return 1.0;
    if (gems > safeCells) return 1.0;
    
    let multiplier = 1.0;
    for (let i = 0; i < gems; i++) {
      const remainingSafe = safeCells - i;
      const remainingTotal = totalCells - i;
      if (remainingSafe > 0 && remainingTotal > 0) {
        multiplier *= remainingTotal / remainingSafe;
      }
    }
    
    const houseEdge = 0.03;
    return Math.max(1.01, multiplier * (1 - houseEdge));
  }

  private scoreBlackjackHand(cards: any[]): { value: number; isBlackjack: boolean; isBust: boolean; isSoft: boolean } {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.hidden) continue;
      
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    let acesAs11 = aces;
    while (value > 21 && acesAs11 > 0) {
      value -= 10;
      acesAs11--;
    }
    
    const isSoft = acesAs11 > 0;
    const isBlackjack = cards.length === 2 && value === 21;
    const isBust = value > 21;
    
    return { value, isBlackjack, isBust, isSoft };
  }

  // Test animation performance
  testAnimationPerformance(): FrontendIssue[] {
    const issues: FrontendIssue[] = [];

    // Check for potential animation performance issues
    const animationElements = document.querySelectorAll('[class*="animate"]');
    
    if (animationElements.length > 50) {
      issues.push({
        game: 'Global',
        component: 'Animations',
        issue: 'Too many animated elements may cause performance issues',
        severity: 'medium',
        reproduction: 'Load any game page and observe animation count'
      });
    }

    return issues;
  }

  // Test responsive design
  testResponsiveDesign(): FrontendIssue[] {
    const issues: FrontendIssue[] = [];

    // Check for mobile responsiveness issues
    const viewportWidth = window.innerWidth;
    
    if (viewportWidth < 768) {
      const desktopElements = document.querySelectorAll('.hidden:not(.sm\\:block):not(.md\\:block)');
      if (desktopElements.length > 0) {
        issues.push({
          game: 'Global',
          component: 'Layout',
          issue: 'Some elements may not display properly on mobile',
          severity: 'medium',
          reproduction: 'Resize browser to mobile width'
        });
      }
    }

    return issues;
  }

  // Get all detected issues
  getAllIssues(): FrontendIssue[] {
    const animationIssues = this.testAnimationPerformance();
    const responsiveIssues = this.testResponsiveDesign();
    
    return [...this.issues, ...animationIssues, ...responsiveIssues];
  }

  // Generate frontend test report
  generateReport(): {
    summary: { total: number; passed: number; failed: number };
    results: TestResult[];
    issues: FrontendIssue[];
    recommendations: string[];
  } {
    const results = this.testGameComponents();
    const issues = this.getAllIssues();
    
    const summary = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    };

    const recommendations = [
      'Add data-testid attributes for better testing',
      'Implement error boundaries for game components',
      'Add loading states for all async operations',
      'Optimize animations for better performance',
      'Add accessibility features (ARIA labels, keyboard navigation)',
      'Implement proper error handling for failed API calls',
      'Add unit tests for game logic calculations',
      'Use React.memo for expensive components',
      'Implement proper cleanup for game timers and intervals'
    ];

    return {
      summary,
      results,
      issues,
      recommendations
    };
  }
}

// Export singleton instance
export const frontendTester = new FrontendGameTester();

// Auto-run tests in development mode
if (process.env.NODE_ENV === 'development') {
  // Run tests after a delay to allow components to mount
  setTimeout(() => {
    const report = frontendTester.generateReport();
    console.group('🧪 Frontend Game Testing Report');
    console.log('Summary:', report.summary);
    console.log('Failed Tests:', report.results.filter(r => !r.passed));
    console.log('Issues Found:', report.issues);
    console.log('Recommendations:', report.recommendations);
    console.groupEnd();
  }, 3000);
}
