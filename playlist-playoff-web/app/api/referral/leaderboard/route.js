import { getPool, ensureTable } from '../../../../lib/db';

// Masks an email for public display: keeps the first character of the local
// part and the domain, hides the rest — e.g. "landen@example.com" becomes
// "l***@example.com". Good enough to feel personal without publishing a
// usable address. Anyone with no email on file (or no DB configured) shows
// as "Anonymous" instead.
function maskEmail(email) {
  if (!email || !email.includes('@')) return null;
  const [local, domain] = email.split('@');
  const visible = local.slice(0, 1) || '•';
  return `${visible}***@${domain}`;
}

// Public leaderboard — the top 5 referral codes by referred_count. Powers
// the "top referrers" list shown after someone joins the waitlist. No auth
// required (it's the whole point — social proof), and no raw email or
// referral code ever leaves the server.
export async function GET() {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false, entries: [] });

  try {
    await ensureTable();
    const result = await pool.query(
      `SELECT owner_email, referred_count
       FROM referral_codes
       WHERE referred_count > 0
       ORDER BY referred_count DESC, created_at ASC
       LIMIT 5`
    );
    const entries = result.rows.map((row, i) => ({
      rank: i + 1,
      referredCount: Number(row.referred_count),
      displayName: maskEmail(row.owner_email) || 'Anonymous',
    }));
    return Response.json({ configured: true, entries });
  } catch (e) {
    console.error('Failed to load referral leaderboard:', e.message);
    return Response.json({ configured: false, entries: [] });
  }
}
