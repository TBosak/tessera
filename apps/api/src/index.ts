import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
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

const __dirname = dirname(fileURLToPath(import.meta.url));
// Try multiple possible paths for the frontend dist
const possiblePaths = [
  join(__dirname, '../../../web/dist'),          // Development
  join(__dirname, '../../web/dist'),             // Railway build
  join(process.cwd(), 'apps/web/dist'),         // Alternative
  join(process.cwd(), 'web/dist')               // Another alternative
];

let frontendDistPath = '';
for (const path of possiblePaths) {
  console.log('🔍 Checking path:', path, 'exists:', existsSync(path));
  if (existsSync(path)) {
    frontendDistPath = path;
    break;
  }
}

console.log('🌐 Using frontend dist path:', frontendDistPath);
console.log('📁 Frontend dist exists:', existsSync(frontendDistPath));

// Only serve static files if frontend dist exists
if (frontendDistPath && existsSync(frontendDistPath)) {
  app.use('/*', serveStatic({ 
    root: frontendDistPath,
    onNotFound: (path, c) => {
      console.log('🔍 Static file not found:', path);
      // For SPA routing, return index.html for non-API routes
      if (!path.startsWith('/api/')) {
        const indexPath = join(frontendDistPath, 'index.html');
        console.log('📄 Serving index.html from:', indexPath);
        console.log('📄 Index.html exists:', existsSync(indexPath));
        if (existsSync(indexPath)) {
          return c.html(Bun.file(indexPath));
        }
      }
    }
  }));
} else {
  console.log('⚠️ Frontend dist not found, serving API only');
}

// Fallback route for root path
app.get('/', (c) => {
  if (frontendDistPath && existsSync(join(frontendDistPath, 'index.html'))) {
    return c.html(Bun.file(join(frontendDistPath, 'index.html')));
  } else {
    return c.json({ 
      name: 'Tessera API',
      version: '0.1.0',
      description: 'Ranked choice voting API',
      note: 'Frontend not found - API only mode'
    });
  }
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Tessera API starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};