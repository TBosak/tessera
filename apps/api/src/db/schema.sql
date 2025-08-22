PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  email_verified_at TEXT,
  email_verify_token TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE elections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  owner_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT NOT NULL DEFAULT 'IRV',
  seats INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  tie_break_seed TEXT NOT NULL,
  max_rank INTEGER DEFAULT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE candidates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  info TEXT,
  image_url TEXT,
  sort_index INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE voter_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  issued_to TEXT,
  used_at TEXT
);

CREATE TABLE email_voters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  verify_token_hash TEXT,
  verify_expires_at TEXT,
  verified_at TEXT,
  voted_at TEXT,
  UNIQUE (election_id, email)
);

CREATE TABLE ballots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  election_id INTEGER NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  rankings_json TEXT NOT NULL,
  salt TEXT NOT NULL,
  receipt_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE token_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voter_token_id INTEGER NOT NULL REFERENCES voter_tokens(id) ON DELETE CASCADE,
  receipt_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  window_ends_at TEXT NOT NULL,
  count INTEGER NOT NULL
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);

CREATE TABLE schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);