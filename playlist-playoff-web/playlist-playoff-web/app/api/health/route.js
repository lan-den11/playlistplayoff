import { getPool } from '../../../lib/db';

export async function GET() {
  const pool = getPool();
  if (!pool) return Response.json({ ok: true, database: 'not configured' });
  try {
    await pool.query('SELECT 1');
    return Response.json({ ok: true, database: 'connected' });
  } catch (e) {
    console.error('Health check DB error:', e.message);
    return Response.json({ ok: false, database: 'error' }, { status: 500 });
  }
}
