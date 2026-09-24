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
        -- One row per referral code. owner_* identifies whose link it is, so
        -- a launch script can sort by referred_count and priority-invite the
        -- top referrers via Clerk's waitlistEntries.invite(id) — see
        -- /api/admin/top-referrers.
        CREATE TABLE IF NOT EXISTS referral_codes (
          code TEXT PRIMARY KEY,
          owner_email TEXT,
          owner_waitlist_entry_id TEXT,
          referred_count INT NOT NULL DEFAULT 0,
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
