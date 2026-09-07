import { Pool } from 'pg';

let pool = null;
let ensureTablePromise = null;

// Lazy singleton: the pool (and the "make sure the table exists" check) is
// created once per running process and reused across requests — same
// pattern the old server.js used, just living in Next.js's process instead
// of Express's.
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
