import { getPool, ensureTable } from '../../../lib/db';
import { captureServerEvent } from '../../../lib/posthog-server';

export async function POST(request) {
  const pool = getPool();
  if (!pool) return Response.json({ configured: false });

  const { email, source, distinctId } = await request.json().catch(() => ({}));
  if (!email) return Response.json({ error: 'email is required' }, { status: 400 });

  try {
    await ensureTable();
    await pool.query('INSERT INTO waitlist_signups (email, source) VALUES ($1, $2)', [email, source || null]);
  } catch (e) {
    console.error('Failed to save waitlist signup:', e.message);
    return Response.json({ configured: false });
  }

  const knownPerson = typeof distinctId === 'string' && distinctId.length > 0;
  await captureServerEvent({
    distinctId: knownPerson ? distinctId.slice(0, 200) : crypto.randomUUID(),
    event: 'waitlist_signup_saved',
    properties: {
      source: source || null,
      ...(knownPerson ? {} : { $process_person_profile: false }),
    },
  }).catch((error) => console.error('Failed to capture waitlist_signup_saved:', error.message));

  return Response.json({ configured: true, ok: true });
}
