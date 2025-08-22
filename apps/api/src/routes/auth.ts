import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';
import { LoginSchema, RegisterSchema } from '../lib/validation.js';
import { hashPassword, verifyPassword, signJWT, getCookieOptions } from '../lib/crypto.js';
import { queries } from '../db/database.js';
import { UnauthorizedError, ConflictError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { strictRateLimit } from '../middleware/rateLimit.js';
import { emailService } from '../lib/email.js';
import crypto from 'crypto';

const auth = new Hono();

// Apply rate limiting to auth routes
auth.use('*', strictRateLimit);

// Register new organizer
auth.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  
  // Check if user already exists
  const existingUser = queries.getUserByEmail.get(email);
  if (existingUser) {
    throw new ConflictError('User already exists');
  }
  
  // Generate email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  
  // Hash password and create user with verification token
  const passwordHash = await hashPassword(password);
  const user = queries.createUser.get(email, passwordHash, verifyToken);
  
  // Try to send verification email if email service is configured
  let emailSent = false;
  if (emailService.isEmailConfigured()) {
    emailSent = await emailService.sendVerificationEmail(email, verifyToken);
  }
  
  // Only sign JWT and set cookie if email is not configured OR if user doesn't need email verification
  // If email is configured, user needs to verify first
  let needsVerification = emailService.isEmailConfigured();
  
  if (!needsVerification) {
    // No email verification required, log them in immediately
    const token = signJWT({ userId: user.id, email: user.email }, '7d');
    
    setCookie(c, 'session', token, getCookieOptions());
  }
  
  return c.json({
    user: {
      id: user.id,
      email: user.email,
      email_verified: !needsVerification
    },
    message: needsVerification 
      ? `Registration successful! Please check your email to verify your account. Verification email sent from ${process.env.EMAIL_FROM || process.env.SMTP_USER }.`
      : 'Registration successful!',
    email_sent: emailSent,
    needs_verification: needsVerification,
    ...(needsVerification && { verification_email_from: process.env.EMAIL_FROM || process.env.SMTP_USER })
  });
});

// Verify email
auth.get('/verify-email', async (c) => {
  const token = c.req.query('token');
  
  if (!token) {
    throw new UnauthorizedError('Verification token is required');
  }
  
  // First try to find user by verification token
  let user = queries.getUserByVerifyToken.get(token);
  
  // If not found by token, maybe they're already verified but clicked link again
  if (!user) {
    // Look for any user record that might match this scenario
    // This is a more permissive approach for user experience
    throw new UnauthorizedError('Invalid or expired verification token');
  }
  
  // Check if user is already verified
  if (user.email_verified_at) {
    // User is already verified, just log them in
    const authToken = signJWT({ userId: user.id, email: user.email }, '7d');
    
    setCookie(c, 'session', authToken, getCookieOptions());
    
    return c.json({
      message: 'Email already verified! You are now logged in.',
      user: {
        id: user.id,
        email: user.email,
        email_verified: true
      }
    });
  }
  
  // Mark email as verified
  queries.verifyUserEmail.run(user.id);
  
  // Sign JWT and set cookie to log them in
  const authToken = signJWT({ userId: user.id, email: user.email }, '7d');
  
  setCookie(c, 'session', authToken, getCookieOptions());
  
  return c.json({
    message: 'Email verified successfully! You are now logged in.',
    user: {
      id: user.id,
      email: user.email,
      email_verified: true
    }
  });
});

// Login
auth.post('/login', zValidator('json', LoginSchema), async (c) => {
  console.log('🔐 Login attempt:', { email: c.req.valid('json').email });
  const { email, password } = c.req.valid('json');
  
  // Get user and verify password
  const user = queries.getUserByEmail.get(email);
  if (!user || !user.password_hash) {
    console.log('❌ User not found or no password hash');
    throw new UnauthorizedError('Invalid email or password');
  }
  
  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    console.log('❌ Invalid password');
    throw new UnauthorizedError('Invalid email or password');
  }
  
  // Sign JWT and set cookie
  const token = signJWT({ userId: user.id, email: user.email }, '7d');
  console.log('🍪 Setting cookie, token length:', token.length);
  
  setCookie(c, 'session', token, getCookieOptions());
  
  const response = {
    user: {
      id: user.id,
      email: user.email
    }
  };
  
  console.log('✅ Login successful, returning:', response);
  return c.json(response);
});

// Logout
auth.post('/logout', requireAuth, async (c) => {
  setCookie(c, 'session', '', getCookieOptions(0));
  
  return c.json({ message: 'Logged out successfully' });
});

// Get current user
auth.get('/me', requireAuth, async (c) => {
  const user = c.get('user');
  return c.json({ 
    user: {
      id: user.userId,
      email: user.email,
      email_verified: user.emailVerified
    }
  });
});

export default auth;