import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyJWT } from '../lib/crypto.js';
import { UnauthorizedError } from '../lib/errors.js';
import { queries } from '../db/database.js';

export interface AuthContext {
  userId: number;
  email: string;
  emailVerified: boolean;
}

export async function requireAuth(c: Context, next: Next) {
  const token = getCookie(c, 'session') || c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new UnauthorizedError('No authentication token provided');
  }

  try {
    const payload = verifyJWT(token);
    const user = queries.getUserByEmail.get(payload.email);
    
    if (!user) {
      throw new UnauthorizedError('Invalid token');
    }

    // Add user info to context
    c.set('user', { 
      userId: user.id, 
      email: user.email, 
      emailVerified: !!user.email_verified_at 
    } as AuthContext);
    await next();
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export async function optionalAuth(c: Context, next: Next) {
  const token = getCookie(c, 'session') || c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (token) {
    try {
      const payload = verifyJWT(token);
      const user = queries.getUserByEmail.get(payload.email);
      
      if (user) {
        c.set('user', { 
          userId: user.id, 
          email: user.email, 
          emailVerified: !!user.email_verified_at 
        } as AuthContext);
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }
  }
  
  await next();
}

export async function requireVerifiedEmail(c: Context, next: Next) {
  // First ensure user is authenticated
  await requireAuth(c, async () => {});
  
  const user = c.get('user') as AuthContext;
  
  // Check if email verification is required (if email service is configured)
  const { emailService } = await import('../lib/email.js');
  const requiresVerification = emailService.isEmailConfigured();
  
  if (requiresVerification && !user.emailVerified) {
    throw new UnauthorizedError('Email verification required. Please check your email and verify your account.');
  }
  
  await next();
}