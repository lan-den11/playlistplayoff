import { getPool, ensureTable } from '../../../../lib/db';

const COUNTER_NAME = 'matchups_decided';

export async function GET() {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false, value: 0 });

  try {
    await ensureTable();
    const result = await pool.query('SELECT value FROM site_counters WHERE name = $1', [COUNTER_NAME]);
    return Response.json({ configured: true, value: Number(result.rows[0]?.value || 0) });
  } catch (e) {
    console.error('Failed to read matchup counter:', e.message);
    return Response.json({ configured: false, value: 0 });
  }
}

export async function POST() {
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
    return Response.json({ configured: true, value: Number(result.rows[0].value) });
  } catch (e) {
    console.error('Failed to bump matchup counter:', e.message);
    return Response.json({ configured: false });
  }
}
