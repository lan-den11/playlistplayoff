import { getPool, ensureTable } from '../../../../lib/db';
import { limited } from '../../../../lib/rateLimit';

const COUNTER_NAME = 'matchups_decided';
const READ_CACHE_MS = 5000;

const readCache = (globalThis.__matchupCounterCache ??= { value: null, at: 0 });

export async function GET(request) {
  const blocked = limited(request, 'counter-read', 60, 60_000);
  if (blocked) return blocked;

  const pool = getPool();
  if (!pool) return Response.json({ configured: false, value: 0 });

  if (readCache.value !== null && Date.now() - readCache.at < READ_CACHE_MS) {
    return Response.json({ configured: true, value: readCache.value });
  }

  try {
    await ensureTable();
    const result = await pool.query('SELECT value FROM site_counters WHERE name = $1', [COUNTER_NAME]);
    const value = Number(result.rows[0]?.value || 0);
    readCache.value = value;
    readCache.at = Date.now();
    return Response.json({ configured: true, value });
  } catch (e) {
    console.error('Failed to read matchup counter:', e.message);
    return Response.json({ configured: false, value: 0 });
  }
}

export async function POST(request) {
  const blocked = limited(request, 'counter-bump', 40, 60_000);
  if (blocked) return blocked;

  const pool = getPool();
  if (!pool) return Response.json({ configured: false });

  try {
    await ensureTable();
    const result = await pool.query(
      `INSERT INTO site_counters (name, value) VALUES ($1, 1)
       ON CONFLICT (name) DO UPDATE SET value = site_counters.value + 1
       RETURNING value`,
      [COUNTER_NAME]
    );
    const value = Number(result.rows[0].value);
    readCache.value = value;
    readCache.at = Date.now();
    return Response.json({ configured: true, value });
  } catch (e) {
    console.error('Failed to bump matchup counter:', e.message);
    return Response.json({ configured: false });
  }
}
