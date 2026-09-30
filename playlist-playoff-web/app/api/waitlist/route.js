import { clerkClient } from '@clerk/nextjs/server';
import { getPool, ensureTable } from '../../../lib/db';
import { captureServerEvent } from '../../../lib/posthog-server';
import { clientIp, limited } from '../../../lib/rateLimit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 64;
const MAX_TOKEN_LENGTH = 2048;
const TURNSTILE_ACTION = 'waitlist';

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET;
  if (!secret) return true;
  if (typeof token !== 'string' || !token || token.length > MAX_TOKEN_LENGTH) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== 'unknown') body.set('remoteip', ip);
    const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) throw new Error(`siteverify ${resp.status}`);
    const data = await resp.json();
    if (data.success !== true) {
      console.error('Turnstile rejected token:', (data['error-codes'] || []).join(',') || 'unknown');
      return false;
    }
    if (data.action !== TURNSTILE_ACTION) {
      console.error('Turnstile action mismatch:', data.action);
      return false;
    }
    const hostnames = (process.env.TURNSTILE_HOSTNAMES || '')
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);
    if (hostnames.length && !hostnames.includes(data.hostname)) {
      console.error('Turnstile hostname mismatch:', data.hostname);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Turnstile verification failed:', e.message);
    return false;
  }
}

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
      [email, source]
    );
    return true;
  } catch (e) {
    if (e.code === '23505') return true;
    console.error('Failed to save waitlist signup:', e.message);
    return false;
  }
}

export async function POST(request) {
  const blocked = limited(request, 'waitlist', 8, 10 * 60_000);
  if (blocked) return blocked;

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim().toLowerCase();
  const { distinctId, optedOut, turnstileToken } = body;
  const source = typeof body.source === 'string' ? body.source.slice(0, MAX_SOURCE_LENGTH) : null;

  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_RE.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  if (!(await verifyTurnstile(turnstileToken, clientIp(request)))) {
    return Response.json({ error: "We couldn't verify you're human. Refresh the page and try again." }, { status: 400 });
  }

  const pool = getPool();
  const [clerkOk, dbOk] = await Promise.all([addToClerk(email), addToDatabase(pool, email, source)]);

  if (!(pool ? dbOk : clerkOk)) {
    return Response.json({ error: 'Could not join the waitlist right now. Please try again.' }, { status: 500 });
  }

  if (optedOut === true) return Response.json({ configured: Boolean(pool), ok: true });

  const knownPerson = typeof distinctId === 'string' && distinctId.length > 0;
  await captureServerEvent({
    distinctId: knownPerson ? distinctId.slice(0, 200) : crypto.randomUUID(),
    event: 'waitlist_signup_saved',
    properties: {
      source,
      ...(knownPerson ? {} : { $process_person_profile: false }),
    },
  }).catch((error) => console.error('Failed to capture waitlist_signup_saved:', error.message));

  return Response.json({ configured: Boolean(pool), ok: true });
}
