const { Database } = require('bun:sqlite');
const { readFileSync } = require('fs');
const { join } = require('path');

// Simple database initialization without imports
const db = new Database(process.env.DB_PATH || './tessera.sqlite');

// Enable WAL mode and foreign keys
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');

// Check if migrations table exists
const migrationTableExists = db
  .query(`SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'`)
  .get();

if (!migrationTableExists) {
  // Create fresh database from schema
  const schema = readFileSync(join(__dirname, 'src/db/schema.sql'), 'utf-8');
  db.exec(schema);
  
  // Mark initial schema as migrated
  db.query(`INSERT INTO schema_migrations (version) VALUES ('001_initial')`).run();
  
  console.log('✅ Database initialized with schema');
} else {
  console.log('✅ Database already exists');
}

db.close();