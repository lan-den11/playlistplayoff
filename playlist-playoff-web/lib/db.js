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
        )
      `)
      .catch((e) => console.error('Failed to ensure user_profiles table exists:', e.message));
  }
  return pool;
}

export function ensureTable() {
  return ensureTablePromise;
}
