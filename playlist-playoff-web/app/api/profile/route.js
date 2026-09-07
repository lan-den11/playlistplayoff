import { auth } from '@clerk/nextjs/server';
import { getPool, ensureTable } from '../../../lib/db';

export async function GET() {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getPool();
  if (!pool) return Response.json({ error: 'Database not configured.' }, { status: 503 });

  try {
    await ensureTable();
    const result = await pool.query(
      'SELECT spotify_username, lastfm_username FROM user_profiles WHERE clerk_user_id = $1',
      [userId]
    );
    if (!result.rows.length) return Response.json({ spotifyUsername: null, lastfmUsername: null });
    return Response.json({
      spotifyUsername: result.rows[0].spotify_username,
      lastfmUsername: result.rows[0].lastfm_username,
    });
  } catch (e) {
    console.error('Failed to load profile:', e.message);
    return Response.json({ error: 'Failed to load profile.' }, { status: 500 });
  }
}

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const pool = getPool();
  if (!pool) return Response.json({ error: 'Database not configured.' }, { status: 503 });

  const { spotifyUsername, lastfmUsername } = await request.json().catch(() => ({}));

  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO user_profiles (clerk_user_id, spotify_username, lastfm_username, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (clerk_user_id)
       DO UPDATE SET spotify_username = $2, lastfm_username = $3, updated_at = now()`,
      [userId, spotifyUsername || null, lastfmUsername || null]
    );
    return Response.json({ ok: true });
  } catch (e) {
    console.error('Failed to save profile:', e.message);
    return Response.json({ error: 'Failed to save profile.' }, { status: 500 });
  }
}
