import { Hono } from "hono";
import { authMiddleware } from "@getmocha/users-service/backend";
import { v4 as uuidv4 } from "uuid";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const adminRoutes = new Hono<{ Bindings: Env }>();

// Middleware to check admin permissions (for demo, any authenticated user can access)
const adminMiddleware = async (c: any, next: any) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Authentication required" }, 401);
  }
  // In production, you would check if user has admin role
  // For demo purposes, we'll allow any authenticated user
  return next();
};

// Parse CSV data
function parseCSV(csvText: string): any[] {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) throw new Error('CSV must have at least header and one data row');
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/['"]/g, ''));
    if (values.length === headers.length) {
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }
  }
  
  return data;
}

// Validate and process user data
async function processUserData(db: D1Database, data: any[]): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  
  for (const [index, row] of data.entries()) {
    try {
      const userId = row.id || uuidv4();
      const username = row.username || null;
      const email = row.email;
      const authProvider = row.auth_provider || 'manual';
      
      if (!email) {
        errors.push(`Row ${index + 1}: Email is required`);
        continue;
      }
      
      // Check if user already exists
      const existing = await db.prepare(
        "SELECT id FROM app_users WHERE email = ?"
      ).bind(email).first();
      
      if (existing) {
        errors.push(`Row ${index + 1}: User with email ${email} already exists`);
        continue;
      }
      
      // Insert user
      await db.prepare(
        "INSERT INTO app_users (id, username, email, auth_provider) VALUES (?, ?, ?, ?)"
      ).bind(userId, username, email, authProvider).run();
      
      // Initialize user balance
      await db.prepare(
        "INSERT INTO user_balances (user_id, balance_sol) VALUES (?, ?)"
      ).bind(userId, parseFloat(row.initial_balance || '0')).run();
      
      success++;
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { success, errors };
}

// Validate and process transaction data
async function processTransactionData(db: D1Database, data: any[]): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  
  for (const [index, row] of data.entries()) {
    try {
      const transactionId = uuidv4();
      const userId = row.user_id;
      const walletAddress = row.wallet_address || 'unknown';
      const transactionSignature = row.transaction_signature || `mock_${transactionId}`;
      const transactionType = row.transaction_type;
      const amountSol = parseFloat(row.amount_sol || '0');
      const amountLamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
      const status = row.status || 'confirmed';
      
      if (!userId || !transactionType || !amountSol) {
        errors.push(`Row ${index + 1}: user_id, transaction_type, and amount_sol are required`);
        continue;
      }
      
      if (!['deposit', 'withdrawal', 'bet', 'win'].includes(transactionType)) {
        errors.push(`Row ${index + 1}: Invalid transaction_type`);
        continue;
      }
      
      // Insert transaction
      await db.prepare(
        `INSERT INTO transactions (user_id, wallet_address, transaction_signature, transaction_type, 
         amount_lamports, amount_sol, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(userId, walletAddress, transactionSignature, transactionType, amountLamports, amountSol, status).run();
      
      // Update user balance if confirmed
      if (status === 'confirmed') {
        let balanceChange = 0;
        if (transactionType === 'deposit' || transactionType === 'win') {
          balanceChange = amountLamports;
        } else if (transactionType === 'withdrawal' || transactionType === 'bet') {
          balanceChange = -amountLamports;
        }
        
        if (balanceChange !== 0) {
          await db.prepare(
            `UPDATE user_balances SET 
             balance_lamports = balance_lamports + ?,
             balance_sol = balance_sol + ?,
             updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`
          ).bind(balanceChange, balanceChange / LAMPORTS_PER_SOL, userId).run();
        }
      }
      
      success++;
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { success, errors };
}

// Validate and process game session data
async function processGameSessionData(db: D1Database, data: any[]): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  
  for (const [index, row] of data.entries()) {
    try {
      const sessionId = row.id || uuidv4();
      const userId = row.user_id;
      const gameType = row.game_type;
      const betAmountSol = parseFloat(row.bet_amount_sol || '0');
      const betAmountLamports = Math.floor(betAmountSol * LAMPORTS_PER_SOL);
      const payoutSol = parseFloat(row.payout_sol || '0');
      const payoutLamports = Math.floor(payoutSol * LAMPORTS_PER_SOL);
      const isWin = row.is_win === 'true' || row.is_win === '1';
      const resultData = row.result_data || '{}';
      
      if (!userId || !gameType || !betAmountSol) {
        errors.push(`Row ${index + 1}: user_id, game_type, and bet_amount_sol are required`);
        continue;
      }
      
      // Insert game session
      await db.prepare(
        `INSERT INTO game_sessions (id, user_id, game_type, bet_amount_lamports, bet_amount_sol, 
         result_data, payout_lamports, payout_sol, is_win) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(sessionId, userId, gameType, betAmountLamports, betAmountSol, resultData, payoutLamports, payoutSol, isWin).run();
      
      success++;
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { success, errors };
}

// Process balance data
async function processBalanceData(db: D1Database, data: any[]): Promise<{ success: number; errors: string[] }> {
  const errors: string[] = [];
  let success = 0;
  
  for (const [index, row] of data.entries()) {
    try {
      const userId = row.user_id;
      const balanceSol = parseFloat(row.balance_sol || '0');
      const balanceLamports = Math.floor(balanceSol * LAMPORTS_PER_SOL);
      
      if (!userId) {
        errors.push(`Row ${index + 1}: user_id is required`);
        continue;
      }
      
      // Check if balance record exists
      const existing = await db.prepare(
        "SELECT id FROM user_balances WHERE user_id = ?"
      ).bind(userId).first();
      
      if (existing) {
        // Update existing balance
        await db.prepare(
          "UPDATE user_balances SET balance_lamports = ?, balance_sol = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        ).bind(balanceLamports, balanceSol, userId).run();
      } else {
        // Insert new balance
        await db.prepare(
          "INSERT INTO user_balances (user_id, balance_lamports, balance_sol) VALUES (?, ?, ?)"
        ).bind(userId, balanceLamports, balanceSol).run();
      }
      
      success++;
    } catch (error) {
      errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  return { success, errors };
}

// Dashboard stats endpoint
adminRoutes.get("/dashboard-stats", authMiddleware, adminMiddleware, async (c) => {
  try {
    // Get total users
    const usersResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM app_users").first();
    const totalUsers = (usersResult?.count as number) || 0;
    
    // Get total transactions
    const transactionsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM transactions").first();
    const totalTransactions = (transactionsResult?.count as number) || 0;
    
    // Get total game sessions
    const sessionsResult = await c.env.DB.prepare("SELECT COUNT(*) as count FROM game_sessions").first();
    const totalGameSessions = (sessionsResult?.count as number) || 0;
    
    // Get total volume
    const volumeResult = await c.env.DB.prepare(
      "SELECT SUM(bet_amount_sol) as volume FROM game_sessions"
    ).first();
    const totalVolume = (volumeResult?.volume as number) || 0;
    
    // Mock recent uploads for demo
    const recentUploads = [
      {
        id: '1',
        dataType: 'users',
        filename: 'users_demo.csv',
        recordsProcessed: 100,
        uploadedAt: new Date().toISOString(),
        uploadedBy: 'admin',
        status: 'success' as const
      }
    ];
    
    return c.json({
      totalUsers,
      totalTransactions,
      totalGameSessions,
      totalVolume,
      recentUploads
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// File upload endpoint
adminRoutes.post("/upload-data", authMiddleware, adminMiddleware, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const dataType = formData.get('dataType') as string;
    
    if (!file || !dataType) {
      return c.json({ error: 'File and data type are required' }, 400);
    }
    
    // Read file content
    const fileContent = await file.text();
    let data: any[];
    
    // Parse file based on type
    if (file.name.endsWith('.csv')) {
      data = parseCSV(fileContent);
    } else if (file.name.endsWith('.json')) {
      data = JSON.parse(fileContent);
      if (!Array.isArray(data)) {
        throw new Error('JSON file must contain an array of objects');
      }
    } else {
      return c.json({ error: 'Unsupported file format' }, 400);
    }
    
    if (data.length === 0) {
      return c.json({ error: 'No data found in file' }, 400);
    }
    
    // Process data based on type
    let result: { success: number; errors: string[] };
    
    switch (dataType) {
      case 'users':
        result = await processUserData(c.env.DB, data);
        break;
      case 'transactions':
        result = await processTransactionData(c.env.DB, data);
        break;
      case 'game_sessions':
        result = await processGameSessionData(c.env.DB, data);
        break;
      case 'balances':
        result = await processBalanceData(c.env.DB, data);
        break;
      case 'custom':
        // For custom data, just return success (implement custom logic as needed)
        result = { success: data.length, errors: [] };
        break;
      default:
        return c.json({ error: 'Unsupported data type' }, 400);
    }
    
    return c.json({
      message: `Successfully processed ${result.success} out of ${data.length} records`,
      recordsProcessed: result.success,
      totalRecords: data.length,
      errors: result.errors.slice(0, 10) // Limit errors in response
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({ 
      error: error instanceof Error ? error.message : 'Upload failed' 
    }, 500);
  }
});

// Download template endpoint
adminRoutes.get("/download-template", authMiddleware, adminMiddleware, async (c) => {
  const type = c.req.query('type') || 'users';
  
  const templates: Record<string, string> = {
    users: 'id,username,email,auth_provider,initial_balance\nuser123,johndoe,john@example.com,manual,100.0',
    transactions: 'user_id,wallet_address,transaction_type,amount_sol,status\nuser123,wallet123,deposit,10.0,confirmed',
    game_sessions: 'id,user_id,game_type,bet_amount_sol,payout_sol,is_win,result_data\nsession123,user123,dice,1.0,2.0,true,{}',
    balances: 'user_id,balance_sol\nuser123,100.0',
    referrals: 'referrer_user_id,referred_user_id,referral_code\nuser123,user456,CH123456',
    custom: 'column1,column2,column3\nvalue1,value2,value3'
  };
  
  const template = templates[type] || templates.custom;
  
  return new Response(template, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}_template.csv"`
    }
  });
});

// Export data endpoint
adminRoutes.get("/export-data", authMiddleware, adminMiddleware, async (c) => {
  const type = c.req.query('type') || 'users';
  
  try {
    let query = '';
    let filename = '';
    
    switch (type) {
      case 'users':
        query = 'SELECT id, username, email, auth_provider, created_at FROM app_users ORDER BY created_at DESC';
        filename = 'users_export.csv';
        break;
      case 'transactions':
        query = 'SELECT user_id, wallet_address, transaction_type, amount_sol, status, created_at FROM transactions ORDER BY created_at DESC';
        filename = 'transactions_export.csv';
        break;
      case 'game_sessions':
        query = 'SELECT id, user_id, game_type, bet_amount_sol, payout_sol, is_win, created_at FROM game_sessions ORDER BY created_at DESC';
        filename = 'game_sessions_export.csv';
        break;
      case 'balances':
        query = 'SELECT user_id, balance_sol, total_deposited_lamports, total_wagered_lamports, total_won_lamports FROM user_balances';
        filename = 'balances_export.csv';
        break;
      default:
        return c.json({ error: 'Unsupported export type' }, 400);
    }
    
    const results = await c.env.DB.prepare(query).all();
    
    if (!results.results || results.results.length === 0) {
      return c.json({ error: 'No data found' }, 404);
    }
    
    // Convert to CSV
    const data = results.results as any[];
    const headers = Object.keys(data[0]);
    const csvLines = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    }
    
    const csvContent = csvLines.join('\n');
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    return c.json({ error: 'Export failed' }, 500);
  }
});

export default adminRoutes;
