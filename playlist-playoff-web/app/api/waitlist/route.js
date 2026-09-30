import { clerkClient } from '@clerk/nextjs/server';
import { getPool, ensureTable } from '../../../lib/db';
import { captureServerEvent } from '../../../lib/posthog-server';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function addToClerk(email) {
  try {
    const client = await clerkClient();
    await client.waitlistEntries.create({ emailAddress: email });
    return true;
  } catch (e) {
    const err = e?.errors?.[0];
    if (/exist|duplicate/i.test(err?.code || '')) return true;
    console.error('Failed to add waitlist entry to Clerk:', err?.longMessage || e.message);
    return false;
  }
}

async function addToDatabase(pool, email, source) {
  if (!pool) return true;
  try {
    await ensureTable();
    await pool.query(
      `INSERT INTO waitlist_signups (email, source)
       SELECT $1::text, $2::text
       WHERE NOT EXISTS (SELECT 1 FROM waitlist_signups WHERE lower(email) = $1::text)`,
      [email, source || null]
    );
    return true;
  } catch (e) {
    console.error('Failed to save waitlist signup:', e.message);
    return false;
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const { source, distinctId, optedOut } = body;

  if (!EMAIL_RE.test(email)) return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });

  const pool = getPool();
  const [clerkOk, dbOk] = await Promise.all([addToClerk(email), addToDatabase(pool, email, source)]);

  if (!clerkOk || !dbOk) {
    return Response.json({ error: 'Could not join the waitlist right now. Please try again.' }, { status: 500 });
  }

  if (optedOut === true) return Response.json({ configured: Boolean(pool), ok: true });

  const knownPerson = typeof distinctId === 'string' && distinctId.length > 0;
  await captureServerEvent({
    distinctId: knownPerson ? distinctId.slice(0, 200) : crypto.randomUUID(),
    event: 'waitlist_signup_saved',
    properties: {
      source: source || null,
      ...(knownPerson ? {} : { $process_person_profile: false }),
    },
  }).catch((error) => console.error('Failed to capture waitlist_signup_saved:', error.message));

  return Response.json({ configured: Boolean(pool), ok: true });
}
