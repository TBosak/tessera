import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { handleError } from './lib/errors.js';
import { initializeDatabase } from './db/database.js';
import { organizerCors, publicCors } from './middleware/cors.js';

// Route imports
import authRoutes from './routes/auth.js';
import electionRoutes from './routes/elections.js';
import voteRoutes from './routes/vote.js';
import publicRoutes from './routes/public.js';

const app = new Hono();

// Global middleware
app.use('*', logger());

// Error handler
app.onError(handleError);

// Initialize database
initializeDatabase();

// Organizer routes (strict CORS)
app.use('/api/auth/*', organizerCors);
app.use('/api/elections/*', organizerCors);
app.route('/api/auth', authRoutes);
app.route('/api/elections', electionRoutes);

// Voting routes (moderate CORS)
app.use('/api/vote/*', organizerCors);
app.route('/api/vote', voteRoutes);

// Public API routes (relaxed CORS) - Fixed to avoid conflict with frontend routes
app.use('/api/public/*', publicCors);
app.route('/api/public', publicRoutes);

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Default route
app.get('/', (c) => {
  return c.json({ 
    name: 'Tessera API',
    version: '0.1.0',
    description: 'Ranked choice voting API'
  });
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Tessera API starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};