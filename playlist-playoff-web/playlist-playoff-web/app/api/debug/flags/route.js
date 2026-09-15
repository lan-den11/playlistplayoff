import { debugEvaluateFlags } from '../../../../lib/posthog-server';

// TEMPORARY DIAGNOSTIC ROUTE — delete this file once flags are confirmed
// working. It bypasses every cache and calls PostHog fresh so you can see
// exactly what the server resolves right now, instead of guessing from
// browser behavior that might be affected by CDN/browser caching on top.
//
// Deliberately NOT gated by proxy.js's access-mode redirect (see the
// isAlwaysPublicRoute matcher there) — it has to be reachable even when
// "waitlist-only" mode is what you're trying to debug.
export async function GET() {
  const result = await debugEvaluateFlags();
  return Response.json({
    resolvedAt: new Date().toISOString(),
    ...result,
  });
}
