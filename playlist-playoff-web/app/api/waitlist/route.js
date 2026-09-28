import { getPool, ensureTable } from '../../../lib/db';

export async function POST(request) {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false });

  const { email, source } = await request.json().catch(() => ({}));
  if (!email) return Response.json({ error: 'email is required' }, { status: 400 });

  try {
    await ensureTable();
    await pool.query('INSERT INTO waitlist_signups (email, source) VALUES ($1, $2)', [email, source || null]);
    return Response.json({ configured: true, ok: true });
  } catch (e) {
    console.error('Failed to save waitlist signup:', e.message);
    return Response.json({ configured: false });
  }
}
