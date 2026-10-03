import { Pool } from 'pg';

let pool = null;
let ensureTablePromise = null;

const SETUP_STEPS = [
  `CREATE TABLE IF NOT EXISTS user_profiles (
    clerk_user_id TEXT PRIMARY KEY,
    spotify_username TEXT,
    lastfm_username TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS site_counters (
    name TEXT PRIMARY KEY,
    value BIGINT NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS waitlist_signups (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    source TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS playlist_snapshots (
    playlist_id TEXT PRIMARY KEY,
    playlist_name TEXT,
    tracks JSONB NOT NULL,
    spotify_snapshot_id TEXT,
    content_hash TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    window_key TEXT NOT NULL,
    changed_window_key TEXT NOT NULL,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    taken_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
  `ALTER TABLE playlist_snapshots ADD COLUMN IF NOT EXISTS refresh_token TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_lower_idx ON waitlist_signups (lower(email))`,
  `ALTER TABLE playlist_snapshots ENABLE ROW LEVEL SECURITY`,
];

function sslConfig() {
  const ca = process.env.DATABASE_CA;
  if (ca) return { ca: ca.replace(/\\n/g, '\n'), rejectUnauthorized: true };
  return { rejectUnauthorized: false };
}

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: sslConfig(),
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
    pool.on('error', (e) => console.error('Database pool error:', e.message));
    ensureTablePromise = (async () => {
      for (const sql of SETUP_STEPS) {
        try {
          await pool.query(sql);
        } catch (e) {
          console.error('Database setup step failed:', e.message);
        }
      }
    })();
  }
  return pool;
}

export function ensureTable() {
  return ensureTablePromise;
}
