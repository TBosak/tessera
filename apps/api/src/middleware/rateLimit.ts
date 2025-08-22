import type { Context, Next } from 'hono';
import { queries } from '../db/database.js';
import { RateLimitError } from '../lib/errors.js';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (c: Context) => string;
}

export function rateLimit(options: RateLimitOptions) {
  return async (c: Context, next: Next) => {
    // Clean up expired rate limit entries
    queries.cleanupRateLimits.run();

    const key = options.keyGenerator ? options.keyGenerator(c) : getDefaultKey(c);
    const windowEnd = new Date(Date.now() + options.windowMs).toISOString();

    // Check current rate limit
    const current = queries.getRateLimit.get(key);
    
    if (current) {
      if (current.count >= options.maxRequests) {
        const retryAfter = Math.ceil((new Date(current.window_ends_at).getTime() - Date.now()) / 1000);
        throw new RateLimitError(retryAfter);
      }
      
      // Increment counter
      queries.updateRateLimit.run(key);
    } else {
      // Create new rate limit entry
      queries.insertRateLimit.run(key, windowEnd, 1);
    }

    await next();
  };
}

function getDefaultKey(c: Context): string {
  const ip = c.req.header('CF-Connecting-IP') || 
             c.req.header('X-Forwarded-For') || 
             c.req.header('X-Real-IP') || 
             'unknown';
  
  // Mask last octet of IP for privacy
  const maskedIp = ip.split('.').slice(0, 3).join('.') + '.xxx';
  return `ip:${maskedIp}:${c.req.path}`;
}

// Common rate limiters
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10
});

export const moderateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  maxRequests: 30
});

export const lenientRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60
});