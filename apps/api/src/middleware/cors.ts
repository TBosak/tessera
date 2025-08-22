import { cors } from 'hono/cors';

// Strict CORS for organizer API
export const organizerCors = cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
});

// Relaxed CORS for public read endpoints
export const publicCors = cors({
  origin: '*', // Allow all origins for public endpoints
  allowMethods: ['GET', 'OPTIONS'],
  allowHeaders: ['Content-Type']
});