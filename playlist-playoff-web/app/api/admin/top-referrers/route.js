import { getPool, ensureTable } from '../../../../lib/db';

// Launch-day operational tool, not a user-facing page: who to
// priority-invite first via Clerk's server-side
// `clerkClient.waitlistEntries.invite(id)`, ranked by referral count.
// Protected by a shared secret rather than a login since this is a
// one-person job. Set ADMIN_SECRET in the environment, then call this route
// with header `x-admin-secret: <that value>`.
export async function GET(request) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return Response.json({ error: 'ADMIN_SECRET is not configured.' }, { status: 503 });
  if (request.headers.get('x-admin-secret') !== secret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pool = getPool();
  if (!pool) return Response.json({ error: 'Database not configured.' }, { status: 503 });

  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT code, owner_email, owner_waitlist_entry_id, referred_count
       FROM referral_codes
       WHERE referred_count > 0
       ORDER BY referred_count DESC
       LIMIT 200`
    );
    return Response.json({ referrers: result.rows });
  } catch (e) {
    console.error('Failed to load top referrers:', e.message);
    return Response.json({ error: 'Failed to load top referrers.' }, { status: 500 });
  }
}
