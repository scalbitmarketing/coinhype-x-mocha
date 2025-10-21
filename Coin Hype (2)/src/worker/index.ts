import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";
import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair, Transaction, SystemProgram } from "@solana/web3.js";
import {
  authMiddleware,
} from "@getmocha/users-service/backend";
import { v4 as uuidv4 } from "uuid";
import { createSupabaseClient } from './supabaseClient';
import gameRoutes from './gameEndpoints';
import referralRoutes from './referralEndpoints';
import adminRoutes from './adminEndpoints';
import authRoutes from './authEndpoints';
import sportsRoutes from './sportsEndpoints';

const app = new Hono<{ Bindings: Env }>();

// Basic security headers
app.use("/*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("X-XSS-Protection", "1; mode=block");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// CORS middleware
app.use("/*", cors({
  origin: (origin) => origin || "*",
  credentials: true,
}));

// Authentication routes
app.route('/', authRoutes);

// Game routes
app.route('/api/games', gameRoutes);

// Referral routes  
app.route('/api/referrals', referralRoutes);

// Admin routes
app.route('/api/admin', adminRoutes);

// Sports routes
app.route('/api/sports', sportsRoutes);

// Initialize Supabase client helper
function getSupabase(c: any) {
  return createSupabaseClient(c.env);
}

// Combined auth middleware (supports both manual and OAuth)
const combinedAuthMiddleware = async (c: any, next: any) => {
  // Try manual auth first
  const manualSessionToken = getCookie(c, 'mocha_manual_session');
  if (manualSessionToken) {
    try {
      const session = await c.env.DB.prepare(`
        SELECT us.user_id, au.username, au.email, au.auth_provider
        FROM user_sessions us
        JOIN app_users au ON us.user_id = au.id
        WHERE us.session_token = ? AND us.expires_at > datetime('now')
      `).bind(manualSessionToken).first() as {
        user_id: string;
        username: string;
        email: string;
        auth_provider: string;
      } | null;
      
      if (session) {
        c.set('user', {
          id: session.user_id,
          email: session.email,
          username: session.username,
          auth_provider: session.auth_provider
        });
        return next();
      }
    } catch (error) {
      // Fall through to OAuth auth
      console.error('Manual auth failed:', error);
    }
  }
  
  // Try OAuth auth
  return authMiddleware(c, next);
};

// Ensure user exists in both systems
async function ensureUser(c: any, user: any) {
  // Ensure user exists in D1 database
  const existingUser = await c.env.DB.prepare(
    "SELECT * FROM app_users WHERE id = ?"
  ).bind(user.id).first();
  
  if (!existingUser) {
    await c.env.DB.prepare(
      `INSERT INTO app_users (id, username, email, auth_provider, auth_provider_id) 
       VALUES (?, ?, ?, ?, ?)`
    ).bind(user.id, user.username || null, user.email, 'google', user.id).run();
  }
  
  // Ensure user balance exists
  const existingBalance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();
  
  if (!existingBalance) {
    await c.env.DB.prepare(
      "INSERT INTO user_balances (user_id, balance_sol) VALUES (?, ?)"
    ).bind(user.id, 1000.0).run();
  }
  
  // Also ensure user exists in Supabase
  const supabase = getSupabase(c);
  const { error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (fetchError && fetchError.code === 'PGRST116') {
    const { error: insertError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        wallet_balance: 1000.0,
      });
    
    if (insertError) {
      console.error('Failed to create user in Supabase:', insertError);
    }
  }
}

// Note: Manual auth endpoints are now handled by authRoutes

// Note: OAuth endpoints are now handled by authRoutes

// Solana connection
function getSolanaConnection(env: Env): Connection {
  return new Connection(env.SOLANA_RPC_URL, 'confirmed');
}

function getHouseWallet(env: Env): Keypair {
  const privateKeyArray = JSON.parse(env.HOUSE_WALLET_PRIVATE_KEY);
  return Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
}

// Wallet management endpoints
app.post("/api/wallets/connect", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { walletAddress } = await c.req.json();
  
  if (!walletAddress) {
    return c.json({ error: "Wallet address is required" }, 400);
  }

  try {
    // Validate wallet address
    new PublicKey(walletAddress);
  } catch (error) {
    return c.json({ error: "Invalid wallet address" }, 400);
  }

  // Check if wallet already exists
  const existingWallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ? AND wallet_address = ?"
  ).bind(user.id, walletAddress).first();

  if (!existingWallet) {
    // Add new wallet
    await c.env.DB.prepare(
      "INSERT INTO user_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, ?)"
    ).bind(user!.id, walletAddress, true).run();

    // Initialize user balance if not exists
    const existingBalance = await c.env.DB.prepare(
      "SELECT * FROM user_balances WHERE user_id = ?"
    ).bind(user!.id).first();

    if (!existingBalance) {
      await c.env.DB.prepare(
        "INSERT INTO user_balances (user_id) VALUES (?)"
      ).bind(user!.id).run();
    }
  }

  return c.json({ success: true });
});

app.get("/api/wallets", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const wallets = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();

  return c.json({ wallets: wallets.results });
});

// Enhanced Balance endpoints using Supabase
app.get("/api/balance", authMiddleware, async (c) => {
  const user = c.get("user")!;
  await ensureUser(c, user);
  const supabase = getSupabase(c);
  
  // Get user balance
  const { data: userData, error: balanceError } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', user.id)
    .single();

  if (balanceError) {
    console.error('Balance fetch error:', balanceError);
    return c.json({ error: "Failed to fetch balance" }, 500);
  }

  // Get aggregated transaction data
  const { data: transactions } = await supabase
    .from('crypto_transactions')
    .select('transaction_type, amount')
    .eq('user_id', user.id);

  let totalDeposited = 0;
  let totalWithdrawn = 0;
  let totalWagered = 0;
  let totalWon = 0;

  if (transactions) {
    transactions.forEach(tx => {
      switch (tx.transaction_type) {
        case 'deposit':
          totalDeposited += Math.abs(tx.amount);
          break;
        case 'withdrawal':
          totalWithdrawn += Math.abs(tx.amount);
          break;
        case 'bet':
          totalWagered += Math.abs(tx.amount);
          break;
        case 'win':
          totalWon += Math.abs(tx.amount);
          break;
      }
    });
  }

  return c.json({
    balanceLamports: Math.floor((userData?.wallet_balance || 0) * LAMPORTS_PER_SOL),
    balanceSol: userData?.wallet_balance || 0,
    totalDeposited,
    totalWithdrawn,
    totalWagered,
    totalWon
  });
});

// Deposit endpoint
app.post("/api/deposit", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { transactionSignature } = await c.req.json();
  
  if (!transactionSignature) {
    return c.json({ error: "Transaction signature is required" }, 400);
  }

  const connection = getSolanaConnection(c.env);
  
  try {
    // Get transaction details
    const txInfo = await connection.getTransaction(transactionSignature, {
      commitment: 'confirmed'
    });

    if (!txInfo) {
      return c.json({ error: "Transaction not found" }, 400);
    }

    if (txInfo.meta?.err) {
      return c.json({ error: "Transaction failed on blockchain" }, 400);
    }

    // Check if transaction is already processed
    const existingTx = await c.env.DB.prepare(
      "SELECT * FROM transactions WHERE transaction_signature = ?"
    ).bind(transactionSignature).first();

    if (existingTx) {
      return c.json({ error: "Transaction already processed" }, 400);
    }

    // Verify transaction involves house wallet
    const houseWallet = getHouseWallet(c.env);
    const housePublicKey = houseWallet.publicKey.toBase58();
    
    const postBalances = txInfo.meta?.postBalances || [];
    const preBalances = txInfo.meta?.preBalances || [];
    const accountKeys = txInfo.transaction.message.accountKeys.map(key => key.toBase58());
    
    const houseAccountIndex = accountKeys.indexOf(housePublicKey);
    if (houseAccountIndex === -1) {
      return c.json({ error: "Invalid deposit transaction" }, 400);
    }

    const amountLamports = postBalances[houseAccountIndex] - preBalances[houseAccountIndex];
    if (amountLamports <= 0) {
      return c.json({ error: "No deposit amount found" }, 400);
    }

    const amountSol = amountLamports / LAMPORTS_PER_SOL;

    // Get user's primary wallet
    const userWallet = await c.env.DB.prepare(
      "SELECT * FROM user_wallets WHERE user_id = ? AND is_primary = 1"
    ).bind(user!.id).first();

    if (!userWallet) {
      return c.json({ error: "No wallet connected" }, 400);
    }

    // Record transaction
    await c.env.DB.prepare(
      `INSERT INTO transactions (user_id, wallet_address, transaction_signature, transaction_type, 
       amount_lamports, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id, 
      userWallet!.wallet_address, 
      transactionSignature, 
      'deposit', 
      amountLamports, 
      amountSol, 
      'confirmed'
    ).run();

    // Update user balance
    await c.env.DB.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports + ?,
       balance_sol = balance_sol + ?,
       total_deposited_lamports = total_deposited_lamports + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(amountLamports, amountSol, amountLamports, user!.id).run();

    return c.json({ 
      success: true, 
      amountSol,
      amountLamports,
      transactionSignature 
    });

  } catch (error) {
    console.error('Deposit error:', error);
    return c.json({ error: "Failed to process deposit" }, 500);
  }
});

// Withdrawal endpoint
app.post("/api/withdraw", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { amountSol, destinationAddress } = await c.req.json();
  
  if (!amountSol || !destinationAddress) {
    return c.json({ error: "Amount and destination address are required" }, 400);
  }

  if (amountSol < 0.001 || amountSol > 100) {
    return c.json({ error: "Withdrawal amount must be between 0.001 and 100 SOL" }, 400);
  }

  try {
    // Validate destination address
    new PublicKey(destinationAddress);
  } catch (error) {
    return c.json({ error: "Invalid destination address" }, 400);
  }

  const withdrawalLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);

  // Check user balance
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance || (balance.balance_lamports as number) < withdrawalLamports) {
    return c.json({ error: "Insufficient balance" }, 400);
  }

  const connection = getSolanaConnection(c.env);
  const houseWallet = getHouseWallet(c.env);

  try {
    // Create withdrawal transaction
    const destinationPubkey = new PublicKey(destinationAddress);
    
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: houseWallet.publicKey,
        toPubkey: destinationPubkey,
        lamports: withdrawalLamports,
      })
    );

    // Get latest blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = houseWallet.publicKey;

    // Sign and send transaction
    transaction.sign(houseWallet);
    const signature = await connection.sendRawTransaction(transaction.serialize());

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight: (await connection.getLatestBlockhash()).lastValidBlockHeight,
    }, 'confirmed');

    if (confirmation.value.err) {
      throw new Error('Transaction failed on blockchain');
    }

    // Get user's primary wallet
    const userWallet = await c.env.DB.prepare(
      "SELECT * FROM user_wallets WHERE user_id = ? AND is_primary = 1"
    ).bind(user.id).first();

    if (!userWallet) {
      return c.json({ error: "No wallet connected" }, 400);
    }

    // Record withdrawal transaction
    await c.env.DB.prepare(
      `INSERT INTO transactions (user_id, wallet_address, transaction_signature, transaction_type, 
       amount_lamports, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user.id, 
      destinationAddress, 
      signature, 
      'withdrawal', 
      -withdrawalLamports, 
      -amountSol, 
      'confirmed'
    ).run();

    // Update user balance
    await c.env.DB.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports - ?,
       balance_sol = balance_sol - ?,
       total_withdrawn_lamports = total_withdrawn_lamports + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(withdrawalLamports, amountSol, withdrawalLamports, user.id).run();

    return c.json({ 
      success: true, 
      amountSol,
      amountLamports: withdrawalLamports,
      transactionSignature: signature,
      destinationAddress
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return c.json({ error: "Failed to process withdrawal" }, 500);
  }
});







// Slots game endpoint  
app.post("/api/games/slots/play", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { betAmountSol, reels } = await c.req.json();
  
  if (!betAmountSol || !reels || reels.length !== 3) {
    return c.json({ error: "Bet amount and reels are required" }, 400);
  }

  const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);
  
  // Calculate win based on reel results
  const [reel1, reel2, reel3] = reels;
  const symbols = [
    { multiplier: 2 }, { multiplier: 3 }, { multiplier: 4 }, { multiplier: 5 },
    { multiplier: 10 }, { multiplier: 15 }, { multiplier: 25 }, { multiplier: 50 }
  ];
  
  let multiplier = 0;
  let winType = 'No Match';
  
  // Three of a kind
  if (reel1 === reel2 && reel2 === reel3) {
    multiplier = symbols[reel1].multiplier;
    winType = `Three of a Kind`;
  }
  // Two of a kind
  else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
    const symbol = reel1 === reel2 ? reel1 : reel2 === reel3 ? reel2 : reel1;
    multiplier = Math.max(0.5, symbols[symbol].multiplier * 0.2);
    winType = `Two of a Kind`;
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
    JSON.stringify({ reels, multiplier, winType }),
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



// Blackjack game endpoint
app.post("/api/games/blackjack/play", authMiddleware, async (c) => {
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

  // SERVER-SIDE VALIDATION: Calculate hand values independently (no hidden cards in final calculation)
  const calculateHandValue = (cards: any[]) => {
    let value = 0;
    let aces = 0;
    
    for (const card of cards) {
      // Don't skip hidden cards in final calculation - all cards should be revealed
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
    
    // Check for blackjack - only if exactly 2 cards and value is 21
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



app.get("/api/transactions", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const transactions = await c.env.DB.prepare(
    "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50"
  ).bind(user.id).all();

  return c.json({ transactions: transactions.results });
});

// Leaderboard endpoint
app.get("/api/leaderboard", async (c) => {
  const timeframe = c.req.query('timeframe') || 'all';
  
  try {
    let dateFilter = '';
    if (timeframe === 'week') {
      dateFilter = "AND created_at >= datetime('now', '-7 days')";
    } else if (timeframe === 'month') {
      dateFilter = "AND created_at >= datetime('now', '-30 days')";
    }

    // Get aggregated user stats
    const leaderboardQuery = `
      SELECT 
        ub.user_id,
        'user@example.com' as email,
        ub.total_wagered_lamports,
        ub.total_won_lamports,
        (ub.total_won_lamports - ub.total_wagered_lamports) as net_pnl_lamports,
        COUNT(CASE WHEN t.transaction_type = 'bet' THEN 1 END) as games_played,
        CASE 
          WHEN ub.total_wagered_lamports > 0 
          THEN (CAST(ub.total_won_lamports AS REAL) / ub.total_wagered_lamports) * 100
          ELSE 0 
        END as win_rate
      FROM user_balances ub
      LEFT JOIN transactions t ON ub.user_id = t.user_id ${dateFilter}
      WHERE ub.total_wagered_lamports > 0
      GROUP BY ub.user_id
      ORDER BY net_pnl_lamports DESC
      LIMIT 100
    `;
    
    const results = await c.env.DB.prepare(leaderboardQuery).all();
    
    const leaderboard = results.results.map((row: any, index: number) => ({
      userId: row.user_id,
      email: `player${row.user_id.slice(-4)}@coinhype.com`,
      totalWagered: row.total_wagered_lamports / LAMPORTS_PER_SOL,
      totalWon: row.total_won_lamports / LAMPORTS_PER_SOL,
      netPnL: row.net_pnl_lamports / LAMPORTS_PER_SOL,
      gamesPlayed: row.games_played,
      winRate: row.win_rate,
      rank: index + 1
    }));
    
    return c.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return c.json({ error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Daily bonus endpoints
app.get("/api/daily-bonus/status", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  try {
    // Get last bonus claim
    const lastBonus = await c.env.DB.prepare(
      "SELECT * FROM daily_bonuses WHERE user_id = ? ORDER BY claimed_at DESC LIMIT 1"
    ).bind(user.id).first();
    
    const now = new Date();
    const bonusAmount = 0.001; // Roughly $1 worth of SOL
    let canClaim = true;
    let timeUntilNext = 0;
    let streak = 1;
    
    if (lastBonus) {
      const lastClaimTime = new Date(lastBonus.claimed_at as string);
      const timeDiff = now.getTime() - lastClaimTime.getTime();
      const hoursSinceLastClaim = timeDiff / (1000 * 60 * 60);
      
      if (hoursSinceLastClaim < 24) {
        canClaim = false;
        timeUntilNext = Math.ceil((24 - hoursSinceLastClaim) * 3600);
      }
      
      // Calculate streak
      if (hoursSinceLastClaim < 48) { // Within 48 hours = streak continues
        streak = (lastBonus.streak as number) || 1;
      }
    }
    
    // Get total claimed
    const totalClaimed = await c.env.DB.prepare(
      "SELECT SUM(bonus_amount_sol) as total FROM daily_bonuses WHERE user_id = ?"
    ).bind(user.id).first();
    
    return c.json({
      canClaim,
      lastClaimed: lastBonus?.claimed_at || null,
      timeUntilNext,
      bonusAmount,
      streak: canClaim ? streak : (lastBonus?.streak || 0),
      totalClaimed: (totalClaimed?.total as number) || 0
    });
  } catch (error) {
    console.error('Daily bonus status error:', error);
    return c.json({ error: 'Failed to get bonus status' }, 500);
  }
});

app.post("/api/daily-bonus/claim", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  try {
    // Check if user can claim
    const lastBonus = await c.env.DB.prepare(
      "SELECT * FROM daily_bonuses WHERE user_id = ? ORDER BY claimed_at DESC LIMIT 1"
    ).bind(user.id).first();
    
    const now = new Date();
    if (lastBonus) {
      const lastClaimTime = new Date(lastBonus.claimed_at as string);
      const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastClaim < 24) {
        return c.json({ error: 'Bonus already claimed today' }, 400);
      }
    }
    
    const bonusAmount = 0.001;
    const bonusLamports = Math.floor(bonusAmount * LAMPORTS_PER_SOL);
    
    // Calculate new streak
    let newStreak = 1;
    if (lastBonus) {
      const lastClaimTime = new Date(lastBonus.claimed_at as string);
      const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastClaim < 48) {
        newStreak = ((lastBonus.streak as number) || 1) + 1;
      }
    }
    
    // Record bonus claim
    await c.env.DB.prepare(
      "INSERT INTO daily_bonuses (user_id, bonus_amount_lamports, bonus_amount_sol, streak) VALUES (?, ?, ?, ?)"
    ).bind(user.id, bonusLamports, bonusAmount, newStreak).run();
    
    // Update user balance
    await c.env.DB.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports + ?,
       balance_sol = balance_sol + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(bonusLamports, bonusAmount, user.id).run();
    
    return c.json({
      canClaim: false,
      lastClaimed: now.toISOString(),
      timeUntilNext: 24 * 3600,
      bonusAmount,
      streak: newStreak,
      totalClaimed: bonusAmount
    });
  } catch (error) {
    console.error('Daily bonus claim error:', error);
    return c.json({ error: 'Failed to claim bonus' }, 500);
  }
});

// VIP status endpoint
app.get("/api/vip/status", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  try {
    // Get user balance to check total deposited
    const balance = await c.env.DB.prepare(
      "SELECT * FROM user_balances WHERE user_id = ?"
    ).bind(user.id).first();
    
    const totalDeposited = balance ? (balance.total_deposited_lamports as number) / LAMPORTS_PER_SOL : 0;
    
    // Get or create VIP status
    let vipStatus = await c.env.DB.prepare(
      "SELECT * FROM vip_status WHERE user_id = ?"
    ).bind(user.id).first();
    
    if (!vipStatus && totalDeposited >= 25) {
      // Create VIP status if user qualifies
      await c.env.DB.prepare(
        "INSERT INTO vip_status (user_id, total_deposited_lamports) VALUES (?, ?)"
      ).bind(user.id, Math.floor(totalDeposited * LAMPORTS_PER_SOL)).run();
      
      vipStatus = await c.env.DB.prepare(
        "SELECT * FROM vip_status WHERE user_id = ?"
      ).bind(user.id).first();
    }
    
    return c.json({
      totalDeposited,
      joinDate: vipStatus?.join_date || null,
      bonusesEarned: vipStatus ? (vipStatus.vip_bonuses_earned_lamports as number) / LAMPORTS_PER_SOL : 0
    });
  } catch (error) {
    console.error('VIP status error:', error);
    return c.json({ error: 'Failed to get VIP status' }, 500);
  }
});

// Analytics endpoint
app.post("/api/analytics", async (c) => {
  try {
    const event = await c.req.json();
    
    // In production, you would:
    // 1. Validate the event data
    // 2. Send to your analytics service (Google Analytics, Mixpanel, etc.)
    // 3. Store in database for custom analytics
    
    // For now, just log the event
    console.log('Analytics event:', event);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ error: 'Failed to track event' }, 500);
  }
});

// Health check endpoint
app.get("/api/health", async (c) => {
  try {
    // Check database connection
    await c.env.DB.prepare("SELECT 1").first();
    
    // Check Solana connection
    const connection = getSolanaConnection(c.env);
    const version = await connection.getVersion();
    
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'operational',
        solana: version ? 'operational' : 'degraded',
        version: version || 'unknown'
      }
    });
  } catch (error) {
    return c.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Username validation endpoint
app.post("/api/validate-username", combinedAuthMiddleware, async (c) => {
  const { username } = await c.req.json();
  
  if (!username) {
    return c.json({ error: "Username is required" }, 400);
  }
  
  try {
    const user = await c.env.DB.prepare(
      "SELECT id FROM app_users WHERE username = ?"
    ).bind(username).first();
    
    return c.json({ exists: !!user });
  } catch (error) {
    console.error('Username validation error:', error);
    return c.json({ exists: false });
  }
});

// Tip user endpoint
app.post("/api/tip-user", combinedAuthMiddleware, async (c) => {
  const sender = c.get("user")!;
  const { username, amount } = await c.req.json();
  
  if (!username || !amount) {
    return c.json({ error: "Username and amount are required" }, 400);
  }
  
  if (amount <= 0 || amount > 100) {
    return c.json({ error: "Invalid tip amount" }, 400);
  }
  
  try {
    // Find recipient
    const recipient = await c.env.DB.prepare(
      "SELECT id, username FROM app_users WHERE username = ?"
    ).bind(username).first();
    
    if (!recipient) {
      return c.json({ error: "User not found" }, 404);
    }
    
    if (recipient.id === sender.id) {
      return c.json({ error: "Cannot tip yourself" }, 400);
    }
    
    // Check sender balance
    const senderBalance = await c.env.DB.prepare(
      "SELECT * FROM user_balances WHERE user_id = ?"
    ).bind(sender.id).first();
    
    if (!senderBalance || (senderBalance.balance_sol as number) < amount) {
      return c.json({ error: "Insufficient balance" }, 400);
    }
    
    // Transfer funds
    const amountLamports = Math.floor(amount * 1000000000); // Convert to lamports
    
    // Deduct from sender
    await c.env.DB.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports - ?,
       balance_sol = balance_sol - ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(amountLamports, amount, sender.id).run();
    
    // Add to recipient (ensure they have a balance record)
    const recipientBalance = await c.env.DB.prepare(
      "SELECT * FROM user_balances WHERE user_id = ?"
    ).bind(recipient.id).first();
    
    if (!recipientBalance) {
      await c.env.DB.prepare(
        "INSERT INTO user_balances (user_id, balance_lamports, balance_sol) VALUES (?, ?, ?)"
      ).bind(recipient.id, amountLamports, amount).run();
    } else {
      await c.env.DB.prepare(
        `UPDATE user_balances SET 
         balance_lamports = balance_lamports + ?,
         balance_sol = balance_sol + ?,
         updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`
      ).bind(amountLamports, amount, recipient.id).run();
    }
    
    return c.json({ success: true, message: `Tipped ◎${amount} to ${username}` });
  } catch (error) {
    console.error('Tip error:', error);
    return c.json({ error: "Failed to send tip" }, 500);
  }
});

// API documentation endpoint
app.get("/api/docs", async (c) => {
  const docs = {
    name: "CoinHype API",
    version: "1.0.0",
    description: "Solana-powered crypto casino with provably fair games",
    endpoints: {
      auth: {
        "GET /api/oauth/google/redirect_url": "Get Google OAuth redirect URL",
        "POST /api/sessions": "Exchange auth code for session",
        "GET /api/users/me": "Get current user info",
        "GET /api/logout": "Logout and clear session"
      },
      wallet: {
        "POST /api/wallets/connect": "Connect Solana wallet",
        "GET /api/wallets": "Get connected wallets",
        "GET /api/balance": "Get user balance and stats",
        "POST /api/deposit": "Process SOL deposit",
        "POST /api/withdraw": "Process SOL withdrawal"
      },
      games: {
        "POST /api/games/dice/play": "Play dice game",
        "POST /api/games/crash/play": "Play crash game",
        "POST /api/games/mines/play": "Play mines game",
        "POST /api/games/plinko/play": "Play plinko game",
        "POST /api/games/slots/play": "Play slots game",
        "POST /api/games/roulette/play": "Play roulette game",
        "POST /api/games/blackjack/play": "Play blackjack game",
        "POST /api/games/poker/play": "Play poker game",
        "POST /api/games/coinflip/play": "Play coin flip game",
        "POST /api/games/rps/play": "Play rock paper scissors",
        "POST /api/games/crossroads/play": "Play crossroads game",
        "POST /api/games/scratchoff/play": "Play scratch off game"
      },
      social: {
        "GET /api/leaderboard": "Get player leaderboard",
        "GET /api/transactions": "Get transaction history",
        "GET /api/daily-bonus/status": "Get daily bonus status",
        "POST /api/daily-bonus/claim": "Claim daily bonus",
        "GET /api/vip/status": "Get VIP status"
      },
      system: {
        "GET /api/health": "Health check",
        "POST /api/analytics": "Track analytics event"
      }
    },
    blockchain: {
      network: "Solana Mainnet",
      houseWallet: "3cpyvHd8Y8KqWfq9H8NWkUvq8EcnSDaAATcqjaKi3Gt7",
      features: ["Provably Fair", "Instant Payouts", "No KYC Required"]
    }
  };
  
  return c.json(docs);
});

// Rate limiting for API endpoints
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: any, next: any) => {
    const clientId = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
    const now = Date.now();
    const key = `${clientId}:${c.req.path}`;
    
    const current = rateLimitStore.get(key);
    if (!current || now > current.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (current.count >= maxRequests) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }
    
    current.count++;
    return next();
  };
}

// Update all other endpoints to use combined auth
app.post("/api/wallets/connect", combinedAuthMiddleware, async (c) => {
  const user = c.get("user")!;
  const { walletAddress } = await c.req.json();
  
  if (!walletAddress) {
    return c.json({ error: "Wallet address is required" }, 400);
  }

  try {
    // Validate wallet address
    new PublicKey(walletAddress);
  } catch (error) {
    return c.json({ error: "Invalid wallet address" }, 400);
  }

  // Check if wallet already exists
  const existingWallet = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ? AND wallet_address = ?"
  ).bind(user.id, walletAddress).first();

  if (!existingWallet) {
    // Add new wallet
    await c.env.DB.prepare(
      "INSERT INTO user_wallets (user_id, wallet_address, is_primary) VALUES (?, ?, ?)"
    ).bind(user!.id, walletAddress, true).run();

    // Initialize user balance if not exists
    const existingBalance = await c.env.DB.prepare(
      "SELECT * FROM user_balances WHERE user_id = ?"
    ).bind(user!.id).first();

    if (!existingBalance) {
      await c.env.DB.prepare(
        "INSERT INTO user_balances (user_id) VALUES (?)"
      ).bind(user!.id).run();
    }
  }

  return c.json({ success: true });
});

app.get("/api/wallets", combinedAuthMiddleware, async (c) => {
  const user = c.get("user")!;
  
  const wallets = await c.env.DB.prepare(
    "SELECT * FROM user_wallets WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(user.id).all();

  return c.json({ wallets: wallets.results });
});

// Update all balance endpoints
app.get("/api/balance", combinedAuthMiddleware, async (c) => {
  const user = c.get("user")!;
  await ensureUser(c, user);
  
  // Get user balance from D1
  const balance = await c.env.DB.prepare(
    "SELECT * FROM user_balances WHERE user_id = ?"
  ).bind(user.id).first();

  if (!balance) {
    return c.json({
      balanceLamports: 0,
      balanceSol: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      totalWagered: 0,
      totalWon: 0
    });
  }

  return c.json({
    balanceLamports: balance.balance_lamports as number,
    balanceSol: balance.balance_sol as number,
    totalDeposited: (balance.total_deposited_lamports as number) / LAMPORTS_PER_SOL,
    totalWithdrawn: (balance.total_withdrawn_lamports as number) / LAMPORTS_PER_SOL,
    totalWagered: (balance.total_wagered_lamports as number) / LAMPORTS_PER_SOL,
    totalWon: (balance.total_won_lamports as number) / LAMPORTS_PER_SOL
  });
});

// Update other endpoints to use combinedAuthMiddleware
app.post("/api/deposit", combinedAuthMiddleware, async (c) => {
  const user = c.get("user")!;
  const { transactionSignature } = await c.req.json();
  
  if (!transactionSignature) {
    return c.json({ error: "Transaction signature is required" }, 400);
  }

  const connection = getSolanaConnection(c.env);
  
  try {
    // Get transaction details
    const txInfo = await connection.getTransaction(transactionSignature, {
      commitment: 'confirmed'
    });

    if (!txInfo) {
      return c.json({ error: "Transaction not found" }, 400);
    }

    if (txInfo.meta?.err) {
      return c.json({ error: "Transaction failed on blockchain" }, 400);
    }

    // Check if transaction is already processed
    const existingTx = await c.env.DB.prepare(
      "SELECT * FROM transactions WHERE transaction_signature = ?"
    ).bind(transactionSignature).first();

    if (existingTx) {
      return c.json({ error: "Transaction already processed" }, 400);
    }

    // Verify transaction involves house wallet
    const houseWallet = getHouseWallet(c.env);
    const housePublicKey = houseWallet.publicKey.toBase58();
    
    const postBalances = txInfo.meta?.postBalances || [];
    const preBalances = txInfo.meta?.preBalances || [];
    const accountKeys = txInfo.transaction.message.accountKeys.map(key => key.toBase58());
    
    const houseAccountIndex = accountKeys.indexOf(housePublicKey);
    if (houseAccountIndex === -1) {
      return c.json({ error: "Invalid deposit transaction" }, 400);
    }

    const amountLamports = postBalances[houseAccountIndex] - preBalances[houseAccountIndex];
    if (amountLamports <= 0) {
      return c.json({ error: "No deposit amount found" }, 400);
    }

    const amountSol = amountLamports / LAMPORTS_PER_SOL;

    // Get user's primary wallet
    const userWallet = await c.env.DB.prepare(
      "SELECT * FROM user_wallets WHERE user_id = ? AND is_primary = 1"
    ).bind(user!.id).first();

    if (!userWallet) {
      return c.json({ error: "No wallet connected" }, 400);
    }

    // Record transaction
    await c.env.DB.prepare(
      `INSERT INTO transactions (user_id, wallet_address, transaction_signature, transaction_type, 
       amount_lamports, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      user!.id, 
      userWallet!.wallet_address, 
      transactionSignature, 
      'deposit', 
      amountLamports, 
      amountSol, 
      'confirmed'
    ).run();

    // Update user balance
    await c.env.DB.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports + ?,
       balance_sol = balance_sol + ?,
       total_deposited_lamports = total_deposited_lamports + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(amountLamports, amountSol, amountLamports, user!.id).run();

    return c.json({ 
      success: true, 
      amountSol,
      amountLamports,
      transactionSignature 
    });

  } catch (error) {
    console.error('Deposit error:', error);
    return c.json({ error: "Failed to process deposit" }, 500);
  }
});

// Apply rate limiting to sensitive endpoints
app.use("/api/games/*", rateLimit(100, 60000)); // 100 requests per minute for games
app.use("/api/deposit", rateLimit(10, 60000)); // 10 deposits per minute
app.use("/api/withdraw", rateLimit(5, 60000)); // 5 withdrawals per minute

export default app;
