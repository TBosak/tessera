import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { platform } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Ensure data directory exists
const dbPath = process.env.DB_PATH || './data/tessera.sqlite';
const dbDir = dirname(dbPath);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

// Platform-specific SQLite configuration for cross-platform compatibility
const isWindows = platform() === 'win32';
const dbOptions = isWindows ? { 
  // Windows-specific options for better compatibility
  create: true,
  readwrite: true
} : undefined;

console.log(`🗄️ Initializing SQLite database at: ${dbPath} (Platform: ${platform()})`);

export const db = new Database(dbPath, dbOptions);

// Cross-platform SQLite configuration
// Windows has issues with WAL mode and shared memory, so we use more conservative settings
if (isWindows) {
  console.log('🪟 Applying Windows-specific SQLite settings');
  // Very conservative settings for Windows
  db.exec('PRAGMA journal_mode = TRUNCATE'); // More reliable than DELETE on Windows
  db.exec('PRAGMA synchronous = FULL');      // Maximum safety on Windows
  db.exec('PRAGMA locking_mode = EXCLUSIVE'); // Exclusive locking for Windows
  db.exec('PRAGMA temp_store = MEMORY');
  db.exec('PRAGMA cache_size = 500');
} else {
  console.log('🐧 Applying Unix/Linux-specific SQLite settings');
  // More performant settings for Unix-like systems
  db.exec('PRAGMA journal_mode = DELETE');
  db.exec('PRAGMA synchronous = NORMAL');
  db.exec('PRAGMA temp_store = memory');
  db.exec('PRAGMA cache_size = 1000');
}

// Common settings for all platforms
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA busy_timeout = 30000'); // 30 second timeout for better Windows compatibility

// Test database connection
try {
  const testResult = db.query('SELECT 1 as test').get();
  console.log('✅ Database connection test successful');
} catch (error) {
  console.error('❌ Database connection failed:', error);
  throw new Error(`Database connection failed: ${error.message}`);
}

export function initializeDatabase() {
  // Check if migrations table exists
  const migrationTableExists = db
    .query(`SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'`)
    .get();

  if (!migrationTableExists) {
    // Create fresh database from schema
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    db.exec(schema);
    
    // Mark initial schema as migrated
    db.query(`INSERT INTO schema_migrations (version) VALUES ('001_initial')`).run();
    
    console.log('Database initialized with schema');
  }
  
  // Prepare queries after database is ready
  prepareQueries();
  console.log('✅ Database queries prepared');
}

// Queries object to be initialized after database setup
export let queries: any = {};

function prepareQueries() {
  queries = {
    // Users
    getUserByEmail: db.query(`SELECT * FROM users WHERE email = ?`),
    createUser: db.query(`INSERT INTO users (email, password_hash, email_verify_token) VALUES (?, ?, ?) RETURNING *`),
    getUserByVerifyToken: db.query(`SELECT * FROM users WHERE email_verify_token = ?`),
    verifyUserEmail: db.query(`UPDATE users SET email_verified_at = datetime('now'), email_verify_token = NULL WHERE id = ?`),
  
  // Elections
  getElectionBySlug: db.query(`SELECT * FROM elections WHERE slug = ?`),
  getElectionById: db.query(`SELECT * FROM elections WHERE id = ?`),
  createElection: db.query(`
    INSERT INTO elections (owner_user_id, slug, title, description, mode, seats, tie_break_seed, max_rank) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
  `),
  updateElectionStatus: db.query(`UPDATE elections SET status = ? WHERE id = ?`),
  
  // Candidates
  getCandidatesByElection: db.query(`SELECT * FROM candidates WHERE election_id = ? ORDER BY sort_index`),
  insertCandidate: db.query(`
    INSERT INTO candidates (election_id, name, info, image_url, sort_index) 
    VALUES (?, ?, ?, ?, ?)
  `),
  deleteCandidatesByElection: db.query(`DELETE FROM candidates WHERE election_id = ?`),
  
  // Voter Tokens
  insertVoterToken: db.query(`
    INSERT INTO voter_tokens (election_id, token_hash, issued_to) 
    VALUES (?, ?, ?)
  `),
  getVoterToken: db.query(`
    SELECT * FROM voter_tokens WHERE token_hash = ? AND used_at IS NULL
  `),
  markTokenUsed: db.query(`UPDATE voter_tokens SET used_at = datetime('now') WHERE id = ?`),
  
  // Ballots
  insertBallot: db.query(`
    INSERT INTO ballots (election_id, rankings_json, salt, receipt_hash) 
    VALUES (?, ?, ?, ?) RETURNING *
  `),
  getBallotsByElection: db.query(`
    SELECT rankings_json FROM ballots WHERE election_id = ?
  `),
  getReceiptsByElection: db.query(`
    SELECT receipt_hash FROM ballots WHERE election_id = ? ORDER BY created_at
  `),
  
  // Token Usage
  insertTokenUsage: db.query(`
    INSERT INTO token_usage (voter_token_id, receipt_hash) VALUES (?, ?)
  `),
  
  // Rate Limiting
  getRateLimit: db.query(`SELECT * FROM rate_limits WHERE key = ? AND window_ends_at > datetime('now')`),
  insertRateLimit: db.query(`INSERT INTO rate_limits (key, window_ends_at, count) VALUES (?, ?, ?)`),
  updateRateLimit: db.query(`UPDATE rate_limits SET count = count + 1 WHERE key = ?`),
  cleanupRateLimits: db.query(`DELETE FROM rate_limits WHERE window_ends_at <= datetime('now')`)
  };
}

// Enhanced graceful shutdown for cross-platform compatibility
function gracefulShutdown(signal: string) {
  console.log(`🔄 Received ${signal}, shutting down gracefully...`);
  try {
    // Close database connection with timeout
    const shutdownTimeout = setTimeout(() => {
      console.log('⚠️ Database shutdown timeout, forcing exit');
      process.exit(1);
    }, 5000);
    
    db.close();
    clearTimeout(shutdownTimeout);
    console.log('✅ Database connection closed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during database shutdown:', error);
    process.exit(1);
  }
}

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Windows-specific signal handling
if (isWindows) {
  process.on('SIGBREAK', () => gracefulShutdown('SIGBREAK'));
  process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
}

export default db;