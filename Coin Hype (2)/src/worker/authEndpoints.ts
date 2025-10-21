import { Hono } from 'hono';
import { exchangeCodeForSessionToken, getOAuthRedirectUrl, deleteSession, MOCHA_SESSION_TOKEN_COOKIE_NAME } from '@getmocha/users-service/backend';
import { setCookie, getCookie } from 'hono/cookie';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

type Env = {
  DB: D1Database;
  MOCHA_USERS_SERVICE_API_URL: string;
  MOCHA_USERS_SERVICE_API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

// Schema validation
const signupSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signinSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Helper function to generate session tokens
function generateSessionToken(): string {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
}

// Manual Email/Password Registration
app.post('/api/auth/signup', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = signupSchema.parse(body);
    const { username, email, password } = validatedData;
    
    // Check if user already exists
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM app_users WHERE email = ? OR username = ?'
    ).bind(email, username).first();
    
    if (existingUser) {
      return c.json({ error: 'User with this email or username already exists' }, 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create user ID
    const userId = crypto.randomUUID();
    
    // Insert user
    await c.env.DB.prepare(`
      INSERT INTO app_users (id, username, email, auth_provider, created_at, updated_at)
      VALUES (?, ?, ?, 'manual', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(userId, username, email).run();
    
    // Store password hash in a separate table (for manual auth users)
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO user_passwords (user_id, password_hash, created_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, hashedPassword).run();
    
    // Initialize user balance
    await c.env.DB.prepare(`
      INSERT INTO user_balances (user_id, balance_lamports, balance_sol, created_at, updated_at)
      VALUES (?, 0, 0.0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(userId).run();
    
    // Create session token
    const sessionToken = generateSessionToken();
    
    // Store session
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, datetime('now', '+60 days'), CURRENT_TIMESTAMP)
    `).bind(userId, sessionToken).run();
    
    // Set cookie
    setCookie(c, 'mocha_manual_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });
    
    return c.json({ success: true, message: 'Account created successfully' });
    
  } catch (error) {
    console.error('Signup error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return c.json({ error: firstError.message }, 400);
    }
    
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Manual Email/Password Sign In
app.post('/api/auth/signin', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate input
    const validatedData = signinSchema.parse(body);
    const { email, password } = validatedData;
    
    // Find user
    const user = await c.env.DB.prepare(
      'SELECT id, username, email FROM app_users WHERE email = ? AND auth_provider = "manual"'
    ).bind(email).first() as { id: string; username: string; email: string } | null;
    
    if (!user) {
      return c.json({ error: 'Invalid email or password' }, 400);
    }
    
    // Get password hash
    const passwordRecord = await c.env.DB.prepare(
      'SELECT password_hash FROM user_passwords WHERE user_id = ?'
    ).bind(user.id).first() as { password_hash: string } | null;
    
    if (!passwordRecord) {
      return c.json({ error: 'Invalid email or password' }, 400);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, passwordRecord.password_hash);
    
    if (!isValidPassword) {
      return c.json({ error: 'Invalid email or password' }, 400);
    }
    
    // Create session token
    const sessionToken = generateSessionToken();
    
    // Store session (remove old sessions first)
    await c.env.DB.prepare('DELETE FROM user_sessions WHERE user_id = ?').bind(user.id).run();
    await c.env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, expires_at, created_at)
      VALUES (?, ?, datetime('now', '+60 days'), CURRENT_TIMESTAMP)
    `).bind(user.id, sessionToken).run();
    
    // Set cookie
    setCookie(c, 'mocha_manual_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });
    
    return c.json({ success: true, message: 'Signed in successfully' });
    
  } catch (error) {
    console.error('Signin error:', error);
    
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return c.json({ error: firstError.message }, 400);
    }
    
    return c.json({ error: 'Failed to sign in' }, 500);
  }
});

// Get current user (supporting both manual and OAuth users)
app.get('/api/users/me', async (c) => {
  try {
    // Try manual session first
    const manualSessionToken = getCookie(c, 'mocha_manual_session');
    
    if (manualSessionToken) {
      // Check manual session
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
        return c.json({
          id: session.user_id,
          email: session.email,
          username: session.username,
          auth_provider: session.auth_provider,
        });
      }
    }
    
    // Try OAuth session (existing Mocha Users Service)
    const mochaSessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    
    if (mochaSessionToken) {
      try {
        // Use the existing auth middleware logic
        const response = await fetch(`${c.env.MOCHA_USERS_SERVICE_API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${mochaSessionToken}`,
            'x-api-key': c.env.MOCHA_USERS_SERVICE_API_KEY,
          },
        });
        
        if (response.ok) {
          const user = await response.json();
          return c.json(user);
        }
      } catch (error) {
        console.error('OAuth session check failed:', error);
      }
    }
    
    return c.json({ error: 'Not authenticated' }, 401);
    
  } catch (error) {
    console.error('User fetch error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Logout (supporting both manual and OAuth users)
app.get('/api/logout', async (c) => {
  try {
    // Clear manual session
    const manualSessionToken = getCookie(c, 'mocha_manual_session');
    if (manualSessionToken) {
      await c.env.DB.prepare('DELETE FROM user_sessions WHERE session_token = ?')
        .bind(manualSessionToken).run();
      
      setCookie(c, 'mocha_manual_session', '', {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
        maxAge: 0,
      });
    }
    
    // Clear OAuth session
    const mochaSessionToken = getCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME);
    if (mochaSessionToken) {
      try {
        await deleteSession(mochaSessionToken, {
          apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
          apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
        });
      } catch (error) {
        console.error('Failed to delete OAuth session:', error);
      }
      
      setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, '', {
        httpOnly: true,
        path: '/',
        sameSite: 'none',
        secure: true,
        maxAge: 0,
      });
    }
    
    return c.json({ success: true });
    
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Failed to logout' }, 500);
  }
});

// OAuth endpoints (existing functionality)
app.get('/api/oauth/google/redirect_url', async (c) => {
  try {
    const redirectUrl = await getOAuthRedirectUrl('google', {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    return c.json({ redirectUrl });
  } catch (error) {
    console.error('OAuth redirect URL error:', error);
    return c.json({ error: 'Failed to get OAuth redirect URL' }, 500);
  }
});

app.post('/api/sessions', async (c) => {
  try {
    const body = await c.req.json();

    if (!body.code) {
      return c.json({ error: 'No authorization code provided' }, 400);
    }

    const sessionToken = await exchangeCodeForSessionToken(body.code, {
      apiUrl: c.env.MOCHA_USERS_SERVICE_API_URL,
      apiKey: c.env.MOCHA_USERS_SERVICE_API_KEY,
    });

    setCookie(c, MOCHA_SESSION_TOKEN_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: 'none',
      secure: true,
      maxAge: 60 * 24 * 60 * 60, // 60 days
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('OAuth session exchange error:', error);
    return c.json({ error: 'Failed to exchange code for session' }, 500);
  }
});

export default app;
