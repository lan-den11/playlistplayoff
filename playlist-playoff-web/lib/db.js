import { Pool } from 'pg';

let pool = null;
let ensureTablePromise = null;

export function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    ensureTablePromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS user_profiles (
          clerk_user_id TEXT PRIMARY KEY,
          spotify_username TEXT,
          lastfm_username TEXT,
          updated_at TIMESTAMPTZ DEFAULT now()
        );
        CREATE TABLE IF NOT EXISTS site_counters (
          name TEXT PRIMARY KEY,
          value BIGINT NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS waitlist_signups (
          id SERIAL PRIMARY KEY,
          email TEXT NOT NULL,
          source TEXT,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `)
      .catch((e) => console.error('Failed to ensure tables exist:', e.message));
  }
  return pool;
}

export function ensureTable() {
  return ensureTablePromise;
}
