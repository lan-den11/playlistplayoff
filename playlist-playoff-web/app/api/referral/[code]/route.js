import { getPool, ensureTable } from '../../../../lib/db';

// Lets a visitor see how many people have joined through their own link.
export async function GET(_request, { params }) {
  const { code } = await params;
  const pool = getPool();
  if (!pool) return Response.json({ configured: false, count: 0 });

  try {
    await ensureTable();
    const result = await pool.query('SELECT referred_count FROM referral_codes WHERE code = $1', [code]);
    return Response.json({ configured: true, count: Number(result.rows[0]?.referred_count || 0) });
  } catch (e) {
    console.error('Failed to read referral count:', e.message);
    return Response.json({ configured: false, count: 0 });
  }
}
