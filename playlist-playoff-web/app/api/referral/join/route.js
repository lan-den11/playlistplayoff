import { getPool, ensureTable } from '../../../../lib/db';

// Called when a NEW visitor joins the waitlist after arriving via someone
// else's `?ref=CODE` link — credits that code with one more referral.
// Upserts rather than requiring the code to pre-exist, so a referral is
// never lost even if the owner's own /register call hasn't landed yet.
export async function POST(request) {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false });

  const { code } = await request.json().catch(() => ({}));
  if (!code) return Response.json({ error: 'code is required' }, { status: 400 });

  try {
    await ensureTable();
    const result = await pool.query(
      `INSERT INTO referral_codes (code, referred_count) VALUES ($1, 1)
       ON CONFLICT (code) DO UPDATE SET referred_count = referral_codes.referred_count + 1
       RETURNING referred_count`,
      [code]
    );
    return Response.json({ configured: true, referredCount: Number(result.rows[0].referred_count) });
  } catch (e) {
    console.error('Failed to record referral join:', e.message);
    return Response.json({ configured: false });
  }
}
