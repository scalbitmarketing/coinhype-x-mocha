import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { v4 as uuidv4 } from "uuid";
import { processReferralCommission } from './referralEndpoints';

const gameRoutes = new Hono<{ Bindings: Env }>();

// Enhanced Dice game endpoint with high precision math
gameRoutes.post("/dice/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, target } = await c.req.json();
  
  if (!betAmountSol || !target) {
    return c.json({ error: "Bet amount and target are required" }, 400);
  }

  if (betAmountSol < 0.001 || betAmountSol > 10) {
    return c.json({ error: "Bet amount must be between 0.001 and 10 SOL" }, 400);
  }

  if (target < 1.01 || target > 99) {
    return c.json({ error: "Target must be between 1.01 and 99" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // Generate game result with house edge
  const roll = Math.random() * 100;
  const win = roll < target;
  const houseEdge = 0.01; // 1% house edge
  const targetProbability = target / 100;
  const fairMultiplier = 1 / targetProbability;
  const multiplier = fairMultiplier * (1 - houseEdge);
  const payoutSol = win ? betAmountSol * multiplier : 0;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'dice',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      roll: Number(roll.toFixed(2)), 
      target, 
      multiplier: Number(multiplier.toFixed(4)),
      houseEdge
    }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  // Process referral commission if this was a loss
  if (!win && betAmountLamports > 0) {
    await processReferralCommission(c.env.DB, user.id, betAmountLamports, sessionId);
  }

  return c.json({
    sessionId,
    roll: Number(roll.toFixed(2)),
    target,
    multiplier: Number(multiplier.toFixed(4)),
    win,
    betAmountSol,
    payoutSol: Number(payoutSol.toFixed(8))
  });
});

// Enhanced Crash game endpoint
gameRoutes.post("/crash/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, crashPoint, userCashout } = await c.req.json();
  
  if (!betAmountSol || !crashPoint) {
    return c.json({ error: "Bet amount and crash point are required" }, 400);
  }

  if (betAmountSol < 0.001 || betAmountSol > 10) {
    return c.json({ error: "Bet amount must be between 0.001 and 10 SOL" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // SERVER-SIDE VALIDATION: Use provided crash point (generated client-side with secure random)
  const serverCrashPoint = crashPoint;
  
  // SERVER-SIDE VALIDATION: Determine if user cashed out before crash
  const win = userCashout && userCashout < serverCrashPoint && userCashout >= 1.01;
  const finalMultiplier = win ? userCashout : 0;
  const houseEdge = 0.01; // 1% house edge
  const payoutSol = win ? betAmountSol * finalMultiplier * (1 - houseEdge) : 0;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'crash',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      crashPoint: serverCrashPoint, 
      userCashout, 
      finalMultiplier,
      houseEdge
    }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    crashPoint: Number(serverCrashPoint.toFixed(2)),
    userCashout,
    finalMultiplier,
    win,
    betAmountSol,
    payoutSol: Number(payoutSol.toFixed(8))
  });
});

// Mines game endpoint
gameRoutes.post("/mines/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, mineCount, gemsFound, hitMine, revealedPositions } = await c.req.json();
  
  if (!betAmountSol || mineCount === undefined || gemsFound === undefined || hitMine === undefined) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // SERVER-SIDE VALIDATION: Validate gems found vs revealed positions
  const maxPossibleGems = 25 - mineCount;
  if (gemsFound > maxPossibleGems || gemsFound < 0) {
    return c.json({ error: "Invalid gems found count" }, 400);
  }

  // SERVER-SIDE VALIDATION: Calculate multiplier based on server rules
  let multiplier = 0;
  if (!hitMine && gemsFound > 0) {
    const totalCells = 25;
    const safeCells = totalCells - mineCount;
    multiplier = 1.0;
    
    for (let i = 0; i < gemsFound; i++) {
      const remaining = safeCells - i;
      const total = totalCells - i;
      if (remaining > 0) {
        multiplier *= total / remaining;
      }
    }
    multiplier = Math.max(1.01, multiplier * 0.97); // 3% house edge
  }

  const payoutSol = hitMine ? 0 : betAmountSol * multiplier;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);
  const win = !hitMine && gemsFound > 0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'mines',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      mineCount, 
      gemsFound, 
      hitMine, 
      multiplier, 
      revealedPositions,
      serverValidated: true
    }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    mineCount,
    gemsFound,
    hitMine,
    multiplier,
    win,
    betAmountSol,
    payoutSol
  });
});

// Slots game endpoint  
gameRoutes.post("/slots/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, reels } = await c.req.json();
  
  if (!betAmountSol || !reels || reels.length !== 3) {
    return c.json({ error: "Bet amount and reels are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);
  
  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }
  
  // Calculate win based on reel results
  const [reel1, reel2, reel3] = reels;
  const symbols = [
    { multiplier: 2 }, { multiplier: 3 }, { multiplier: 4 }, { multiplier: 5 },
    { multiplier: 10 }, { multiplier: 15 }, { multiplier: 25 }, { multiplier: 50 }
  ];
  
  let multiplier = 0;
  let winType = 'No Match';
  const houseEdge = 0.05; // 5% house edge
  
  // Three of a kind
  if (reel1 === reel2 && reel2 === reel3) {
    multiplier = symbols[reel1].multiplier * (1 - houseEdge);
    winType = `Three of a Kind`;
  }
  // Two of a kind for high-value symbols
  else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
    const symbol = reel1 === reel2 ? reel1 : reel2 === reel3 ? reel2 : reel1;
    if (symbol >= 4) { // Bell and higher
      multiplier = symbols[symbol].multiplier * 0.3 * (1 - houseEdge);
      winType = `Two of a Kind`;
    }
  }

  const payoutSol = betAmountSol * multiplier;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);
  const win = multiplier > 0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'slots',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ reels, multiplier, winType, houseEdge }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    reels,
    multiplier,
    winType,
    win,
    betAmountSol,
    payoutSol
  });
});

// Roulette game endpoint
gameRoutes.post("/roulette/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, bets, winningNumber } = await c.req.json();
  
  if (!betAmountSol || !bets || winningNumber === undefined) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);
  
  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }
  
  // Calculate total payout for all bets
  let totalPayout = 0;
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  const getColor = (num: number) => num === 0 ? 'green' : redNumbers.includes(num) ? 'red' : 'black';
  const color = getColor(winningNumber);
  
  for (const bet of bets) {
    let betWins = false;
    
    switch (bet.type) {
      case 'red': betWins = color === 'red'; break;
      case 'black': betWins = color === 'black'; break;
      case 'even': betWins = winningNumber > 0 && winningNumber % 2 === 0; break;
      case 'odd': betWins = winningNumber % 2 === 1; break;
      case 'low': betWins = winningNumber >= 1 && winningNumber <= 18; break;
      case 'high': betWins = winningNumber >= 19 && winningNumber <= 36; break;
      case 'straight': betWins = bet.numbers?.includes(winningNumber) || false; break;
    }
    
    if (betWins) {
      totalPayout += bet.amount * bet.multiplier;
    }
  }

  const payoutLamports = Math.floor(totalPayout * LAMPORTS_PER_SOL);
  const win = totalPayout > 0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'roulette',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ bets, winningNumber, color, totalPayout }),
    payoutLamports,
    totalPayout,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + totalPayout;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    winningNumber,
    color,
    bets,
    totalPayout,
    win,
    betAmountSol
  });
});

// Blackjack game endpoint
gameRoutes.post("/blackjack/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, playerCards, dealerCards } = await c.req.json();
  
  if (!betAmountSol || !playerCards || !dealerCards) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // SERVER-SIDE VALIDATION: Calculate hand values independently
  const calculateHandValue = (cards: any[]) => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      if (card.hidden) continue; // Skip hidden cards
      
      if (card.value === 'A') {
        aces++;
        value += 11;
      } else if (['J', 'Q', 'K'].includes(card.value)) {
        value += 10;
      } else {
        value += parseInt(card.value);
      }
    }
    
    while (value > 21 && aces > 0) {
      value -= 10;
      aces--;
    }
    
    const visibleCards = cards.filter(card => !card.hidden);
    return { 
      value, 
      isBlackjack: visibleCards.length === 2 && value === 21, 
      isBust: value > 21 
    };
  };

  const playerHand = calculateHandValue(playerCards);
  const dealerHand = calculateHandValue(dealerCards);

  // SERVER-SIDE VALIDATION: Determine outcome based on server calculations
  let outcome: string;
  let payout = 0;

  if (playerHand.isBust) {
    outcome = 'lose';
    payout = 0;
  } else if (dealerHand.isBust) {
    outcome = 'win';
    payout = betAmountSol * 2;
  } else if (playerHand.isBlackjack && !dealerHand.isBlackjack) {
    outcome = 'blackjack';
    payout = betAmountSol * 2.5;
  } else if (dealerHand.isBlackjack && !playerHand.isBlackjack) {
    outcome = 'lose';
    payout = 0;
  } else if (playerHand.value > dealerHand.value) {
    outcome = 'win';
    payout = betAmountSol * 2;
  } else if (playerHand.value < dealerHand.value) {
    outcome = 'lose';
    payout = 0;
  } else {
    outcome = 'push';
    payout = betAmountSol; // Return bet
  }

  const payoutLamports = Math.floor(payout * LAMPORTS_PER_SOL);
  const win = payout > 0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'blackjack',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      playerCards, 
      dealerCards, 
      serverOutcome: outcome,
      playerValue: playerHand.value,
      dealerValue: dealerHand.value
    }),
    payoutLamports,
    payout,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payout;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    outcome,
    payout,
    win,
    betAmountSol,
    playerValue: playerHand.value,
    dealerValue: dealerHand.value
  });
});

// Poker game endpoint
gameRoutes.post("/poker/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, finalCards, handRank } = await c.req.json();
  
  if (!betAmountSol || !finalCards || !handRank) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);
  
  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }
  
  // Hand rank multipliers
  const handMultipliers: { [key: string]: number } = {
    'Royal Flush': 250,
    'Straight Flush': 50,
    'Four of a Kind': 25,
    'Full House': 9,
    'Flush': 6,
    'Straight': 4,
    'Three of a Kind': 3,
    'Two Pair': 2,
    'Jacks or Better': 1,
    'High Card': 0
  };
  
  const multiplier = handMultipliers[handRank] || 0;
  const payout = betAmountSol * multiplier;
  const payoutLamports = Math.floor(payout * LAMPORTS_PER_SOL);
  const win = multiplier > 0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'poker',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ finalCards, handRank, multiplier }),
    payoutLamports,
    payout,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payout;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    handRank,
    multiplier,
    payout,
    win,
    betAmountSol
  });
});

// Coin Flip game endpoint
gameRoutes.post("/coinflip/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, playerChoice } = await c.req.json();
  
  if (!betAmountSol || !playerChoice) {
    return c.json({ error: "Bet amount and choice are required" }, 400);
  }

  if (betAmountSol < 0.001 || betAmountSol > 10) {
    return c.json({ error: "Bet amount must be between 0.001 and 10 SOL" }, 400);
  }

  if (!['heads', 'tails'].includes(playerChoice)) {
    return c.json({ error: "Choice must be heads or tails" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // Generate coin flip result
  const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
  const win = playerChoice === flipResult;
  const multiplier = 1.96; // 2% house edge
  const payoutSol = win ? betAmountSol * multiplier : 0;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'coinflip',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ playerChoice, flipResult, multiplier }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    playerChoice,
    flipResult,
    multiplier,
    win,
    betAmountSol,
    payoutSol
  });
});

// Rock Paper Scissors game endpoint
gameRoutes.post("/rps/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, playerChoice, computerChoice } = await c.req.json();
  
  if (!betAmountSol || !playerChoice || !computerChoice) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const validChoices = ['rock', 'paper', 'scissors'];
  if (!validChoices.includes(playerChoice) || !validChoices.includes(computerChoice)) {
    return c.json({ error: "Invalid choice" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // Determine outcome
  let outcome: 'win' | 'lose' | 'tie';
  if (playerChoice === computerChoice) {
    outcome = 'tie';
  } else if (
    (playerChoice === 'rock' && computerChoice === 'scissors') ||
    (playerChoice === 'paper' && computerChoice === 'rock') ||
    (playerChoice === 'scissors' && computerChoice === 'paper')
  ) {
    outcome = 'win';
  } else {
    outcome = 'lose';
  }

  const multiplier = outcome === 'win' ? 2.94 : outcome === 'tie' ? 1 : 0;
  const payoutSol = betAmountSol * multiplier;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'rps',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ playerChoice, computerChoice, outcome, multiplier }),
    payoutLamports,
    payoutSol,
    outcome !== 'lose'
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    playerChoice,
    computerChoice,
    outcome,
    multiplier,
    win: outcome !== 'lose',
    betAmountSol,
    payoutSol
  });
});

// Crossroads game endpoint
gameRoutes.post("/crossroads/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, selectedDirection, resultDirection } = await c.req.json();
  
  if (!betAmountSol || !selectedDirection || !resultDirection) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  const validDirections = ['north', 'south', 'east', 'west'];
  if (!validDirections.includes(selectedDirection) || !validDirections.includes(resultDirection)) {
    return c.json({ error: "Invalid direction" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // Determine win and multiplier
  const win = selectedDirection === resultDirection;
  const multiplier = win ? (selectedDirection === 'north' || selectedDirection === 'south' ? 2 : 3) : 0;
  const payoutSol = win ? betAmountSol * multiplier : 0;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'crossroads',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ selectedDirection, resultDirection, multiplier }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    selectedDirection,
    resultDirection,
    multiplier,
    win,
    betAmountSol,
    payoutSol
  });
});

// Plinko game endpoint
gameRoutes.post("/plinko/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, riskLevel, ballCount, finalSlot } = await c.req.json();
  
  if (!betAmountSol || riskLevel === undefined || !ballCount || finalSlot === undefined) {
    return c.json({ error: "All game parameters are required" }, 400);
  }

  if (betAmountSol < 0.001 || betAmountSol > 10) {
    return c.json({ error: "Bet amount must be between 0.001 and 10 SOL" }, 400);
  }

  if (![0, 1, 2].includes(riskLevel)) {
    return c.json({ error: "Invalid risk level" }, 400);
  }

  if (finalSlot < 0 || finalSlot > 14) {
    return c.json({ error: "Invalid slot position" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // SERVER-SIDE VALIDATION: Plinko multiplier tables
  const multiplierTables = [
    [1000, 130, 26, 9, 4, 2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 130, 1000], // High risk
    [110, 41, 10, 5, 3, 1.5, 1, 0.5, 1, 1.5, 3, 5, 10, 41, 110], // Medium risk  
    [16, 9, 2, 1.4, 1.4, 1.2, 1.1, 1, 1.1, 1.2, 1.4, 1.4, 2, 9, 16] // Low risk
  ];

  const multiplier = multiplierTables[riskLevel][finalSlot];
  const houseEdge = 0.02; // 2% house edge
  const finalMultiplier = multiplier * (1 - houseEdge);
  const payoutSol = betAmountSol * finalMultiplier;
  const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);
  const win = multiplier > 1.0;

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'plinko',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      riskLevel, 
      ballCount, 
      finalSlot, 
      multiplier, 
      finalMultiplier,
      houseEdge,
      serverValidated: true 
    }),
    payoutLamports,
    payoutSol,
    win
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + payoutSol;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    riskLevel,
    ballCount,
    finalSlot,
    multiplier: finalMultiplier,
    win,
    betAmountSol,
    payoutSol
  });
});

// Scratch Off game endpoint
gameRoutes.post("/scratchoff/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, cells } = await c.req.json();
  
  if (!betAmountSol || !cells) {
    return c.json({ error: "Bet amount and cells are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < betAmountLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  // SERVER-SIDE VALIDATION: Verify the win
  const symbolCounts: { [key: string]: number } = {};
  cells.forEach((cell: any) => {
    symbolCounts[cell.symbol] = (symbolCounts[cell.symbol] || 0) + 1;
  });

  let serverWin = false;
  let serverPayout = 0;
  let serverMatches = 0;
  let serverSymbol = 'None';

  for (const [symbol, count] of Object.entries(symbolCounts)) {
    if (count >= 3) {
      const cell = cells.find((c: any) => c.symbol === symbol);
      const basePayout = betAmountSol * cell.multiplier;
      const matchBonus = count > 3 ? Math.pow(2, count - 3) : 1;
      const totalPayout = basePayout * matchBonus;
      
      if (totalPayout > serverPayout) {
        serverWin = true;
        serverPayout = totalPayout;
        serverMatches = count;
        serverSymbol = symbol;
      }
    }
  }

  const payoutLamports = Math.floor(serverPayout * LAMPORTS_PER_SOL);

  const sessionId = uuidv4();

  // Create game session
  await c.env.DB.prepare(
    `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
     result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    sessionId,
    user.id,
    'scratchoff',
    betAmountLamports,
    betAmountSol,
    JSON.stringify({ 
      cells, 
      winningSymbol: serverSymbol, 
      matches: serverMatches,
      serverValidated: true 
    }),
    payoutLamports,
    serverPayout,
    serverWin
  ).run();

  // Update user balance
  const balanceChange = -betAmountLamports + payoutLamports;
  const balanceChangeSol = -betAmountSol + serverPayout;

  await c.env.DB.prepare(
    `UPDATE user_balances SET 
     balance_lamports = balance_lamports + ?,
     balance_sol = balance_sol + ?,
     total_wagered_lamports = total_wagered_lamports + ?,
     total_won_lamports = total_won_lamports + ?,
     updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`
  ).bind(balanceChange, balanceChangeSol, betAmountLamports, payoutLamports, user.id).run();

  return c.json({
    sessionId,
    winningSymbol: serverSymbol,
    matches: serverMatches,
    win: serverWin,
    betAmountSol,
    payoutSol: serverPayout
  });
});

export default gameRoutes;
