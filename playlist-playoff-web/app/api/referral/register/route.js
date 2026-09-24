import { getPool, ensureTable } from '../../../../lib/db';

// Called once, right when a visitor joins the waitlist for THEMSELVES —
// attaches their email + Clerk waitlist entry id to the code they're about
// to start sharing. This is what makes /api/admin/top-referrers actionable:
// without an owner on file, a code with a high referred_count has no one to
// invite early.
export async function POST(request) {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false });

  const { code, email, waitlistEntryId } = await request.json().catch(() => ({}));
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 });

  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO referral_codes (code, owner_email, owner_waitlist_entry_id, referred_count)
       VALUES ($1, $2, $3, 0)
       ON CONFLICT (code) DO UPDATE SET owner_email = $2, owner_waitlist_entry_id = $3`,
      [code, email || null, waitlistEntryId || null]
    );
    return Response.json({ configured: true, ok: true });
  } catch (e) {
    console.error('Failed to register referral code:', e.message);
    return Response.json({ configured: false });
  }
}
