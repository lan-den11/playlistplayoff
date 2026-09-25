import { getPool, ensureTable } from '../../../lib/db';

// Fire-and-forget copy of every waitlist signup, independent of Clerk's own
// records — just email + source + when, so it's a plain list you can query
// straight out of Supabase (order of signup falls out of id / created_at).
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
