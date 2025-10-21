import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const referralRoutes = new Hono<{ Bindings: Env }>();

// Generate referral code for user
function generateReferralCode(userId: string): string {
  return `CH${userId.slice(-6).toUpperCase()}`;
}

// Get or create referral code for user
referralRoutes.get("/stats", authMiddleware, async (c) => {
  const user = c.get("user")!;
  
  try {
    // Get or create referral code
    let referralCode = await c.env.DB.prepare(
      "SELECT * FROM referral_codes WHERE user_id = ?"
    ).bind(user.id).first();
    
    if (!referralCode) {
      const code = generateReferralCode(user.id);
      await c.env.DB.prepare(
        "INSERT INTO referral_codes (user_id, referral_code) VALUES (?, ?)"
      ).bind(user.id, code).run();
      
      referralCode = await c.env.DB.prepare(
        "SELECT * FROM referral_codes WHERE user_id = ?"
      ).bind(user.id).first();
    }
    
    // Get referral stats
    const totalReferrals = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ?"
    ).bind(user.id).first();
    
    const activeReferrals = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM referrals WHERE referrer_user_id = ? AND is_active = 1"
    ).bind(user.id).first();
    
    const totalEarnings = await c.env.DB.prepare(
      "SELECT SUM(commission_earned_sol) as total FROM referrals WHERE referrer_user_id = ?"
    ).bind(user.id).first();
    
    // Calculate this month's earnings
    const thisMonthEarnings = await c.env.DB.prepare(
      `SELECT SUM(commission_amount_lamports) as total 
       FROM referral_commissions 
       WHERE referrer_user_id = ? 
       AND paid_at >= datetime('now', 'start of month')`
    ).bind(user.id).first();
    
    const thisMonthSol = (thisMonthEarnings?.total as number || 0) / LAMPORTS_PER_SOL;
    
    // Create referral link
    const baseUrl = c.req.header('origin') || 'https://coinhype.mocha.app';
    const referralLink = `${baseUrl}?ref=${referralCode!.referral_code}`;
    
    return c.json({
      referralCode: referralCode!.referral_code,
      totalReferrals: (totalReferrals?.count as number) || 0,
      activeReferrals: (activeReferrals?.count as number) || 0,
      totalEarnings: (totalEarnings?.total as number) || 0,
      thisMonthEarnings: thisMonthSol,
      commissionRate: (referralCode!.commission_rate as number) * 100,
      pendingPayments: 0, // TODO: Calculate pending payments
      referralLink
    });
  } catch (error) {
    console.error('Referral stats error:', error);
    return c.json({ error: 'Failed to fetch referral stats' }, 500);
  }
});

// Track referral signup
referralRoutes.post("/track-signup", authMiddleware, async (c) => {
  const user = c.get("user")!;
  const { referralCode } = await c.req.json();
  
  if (!referralCode) {
    return c.json({ success: true }); // No referral code, that's fine
  }
  
  try {
    // Find referrer
    const referrer = await c.env.DB.prepare(
      "SELECT * FROM referral_codes WHERE referral_code = ?"
    ).bind(referralCode).first();
    
    if (!referrer || referrer.user_id === user.id) {
      return c.json({ success: true }); // Invalid or self-referral
    }
    
    // Check if already referred
    const existingReferral = await c.env.DB.prepare(
      "SELECT * FROM referrals WHERE referred_user_id = ?"
    ).bind(user.id).first();
    
    if (existingReferral) {
      return c.json({ success: true }); // Already referred
    }
    
    // Create referral record
    await c.env.DB.prepare(
      "INSERT INTO referrals (referrer_user_id, referred_user_id, referral_code) VALUES (?, ?, ?)"
    ).bind(referrer.user_id, user.id, referralCode).run();
    
    // Update referral code stats
    await c.env.DB.prepare(
      "UPDATE referral_codes SET total_referrals = total_referrals + 1 WHERE user_id = ?"
    ).bind(referrer.user_id).run();
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Track referral error:', error);
    return c.json({ error: 'Failed to track referral' }, 500);
  }
});

// Process referral commission (called after game loss)
export async function processReferralCommission(
  db: D1Database, 
  userId: string, 
  lossAmountLamports: number, 
  gameSessionId: string
) {
  try {
    // Find if this user was referred
    const referral = await db.prepare(
      "SELECT * FROM referrals WHERE referred_user_id = ? AND is_active = 1"
    ).bind(userId).first();
    
    if (!referral) return; // No referral
    
    // Get commission rate
    const referralCode = await db.prepare(
      "SELECT * FROM referral_codes WHERE user_id = ?"
    ).bind(referral.referrer_user_id).first();
    
    if (!referralCode) return;
    
    const commissionRate = referralCode.commission_rate as number || 0.10;
    const commissionLamports = Math.floor(lossAmountLamports * commissionRate);
    const commissionSol = commissionLamports / LAMPORTS_PER_SOL;
    
    if (commissionLamports <= 0) return;
    
    // Record commission
    await db.prepare(
      `INSERT INTO referral_commissions 
       (referrer_user_id, referred_user_id, game_session_id, loss_amount_lamports, 
        commission_amount_lamports, commission_rate) 
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(
      referral.referrer_user_id,
      userId,
      gameSessionId,
      lossAmountLamports,
      commissionLamports,
      commissionRate
    ).run();
    
    // Update referral totals
    await db.prepare(
      `UPDATE referrals SET 
       commission_earned_lamports = commission_earned_lamports + ?,
       commission_earned_sol = commission_earned_sol + ?,
       total_referred_losses_lamports = total_referred_losses_lamports + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE referrer_user_id = ? AND referred_user_id = ?`
    ).bind(
      commissionLamports,
      commissionSol,
      lossAmountLamports,
      referral.referrer_user_id,
      userId
    ).run();
    
    // Update referral code totals
    await db.prepare(
      `UPDATE referral_codes SET 
       total_commission_lamports = total_commission_lamports + ?,
       total_commission_sol = total_commission_sol + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(
      commissionLamports,
      commissionSol,
      referral.referrer_user_id
    ).run();
    
    // Pay commission to referrer's balance
    await db.prepare(
      `UPDATE user_balances SET 
       balance_lamports = balance_lamports + ?,
       balance_sol = balance_sol + ?,
       updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`
    ).bind(
      commissionLamports,
      commissionSol,
      referral.referrer_user_id
    ).run();
    
    console.log(`Paid ${commissionSol} SOL commission to ${referral.referrer_user_id} for ${userId}'s loss`);
  } catch (error) {
    console.error('Process referral commission error:', error);
  }
}

export default referralRoutes;
