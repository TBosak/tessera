import { sha256 } from 'js-sha256';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-in-production';

export function hashToken(plaintext: string): string {
  return sha256(plaintext);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export function receiptFor(rankings: number[], salt: Uint8Array): string {
  const rankingsJson = JSON.stringify(rankings);
  const data = new Uint8Array(salt.length + rankingsJson.length);
  data.set(salt);
  data.set(new TextEncoder().encode(rankingsJson), salt.length);
  return sha256(data);
}

// JWT utilities
export function signJWT(payload: string | object | Buffer, expiresIn = '15m'): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyJWT(token: string): any {
  try {
    return jwt.verify(token, SESSION_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Generate tie-break seed for elections
export function generateTieBreakSeed(): string {
  return crypto.getRandomValues(new Uint8Array(16))
    .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}

// Cookie configuration helper for consistent cookie settings
export function getCookieOptions(maxAge?: number) {
  // Extract domain from SITE_URL for production, or use explicit COOKIE_DOMAIN
  let domain: string | undefined;
  
  if (process.env.NODE_ENV === 'development') {
    domain = 'localhost';
  } else if (process.env.COOKIE_DOMAIN) {
    domain = process.env.COOKIE_DOMAIN;
  } else if (process.env.SITE_URL) {
    try {
      const url = new URL(process.env.SITE_URL);
      domain = url.hostname;
    } catch {
      // If SITE_URL is invalid, don't set domain (will default to current domain)
      domain = undefined;
    }
  }
  
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    maxAge: maxAge || 7 * 24 * 60 * 60, // 7 days default
    path: '/',
    ...(domain && { domain })
  };
}