import { PostHog } from 'posthog-node';

export function getPostHogClient() {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

  if ((!token || !host) && process.env.NODE_ENV === 'development') {
    const missingVariable = !token ? 'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN' : 'NEXT_PUBLIC_POSTHOG_HOST';
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`
    );
  }

  if (!token || !host) return null;

  return new PostHog(token, {
    host,
    flushAt: 1,
    flushInterval: 0,
    enableExceptionAutocapture: true,
    // Flag evaluation defaults to a 3s network timeout, which is much too
    // long to risk on every middleware pass (see getAppAccessMode below).
    // Tightened here so a slow/unreachable PostHog fails fast into the
    // in-code default instead of stalling page loads.
    featureFlagsRequestTimeoutMs: 2000,
    // CRITICAL: posthog-node calls the *global* fetch when no custom fetch
    // is supplied — and in a Next.js Server Component or middleware/proxy
    // context, that global fetch is Next's own patched version, which layers
    // its own Data Cache on top of whatever we do here. Forcing `no-store`
    // on every request this client makes removes that second, uncontrolled
    // cache entirely, leaving only our explicit in-memory TTL below as the
    // one source of staleness. Safe for capture()'s POST calls too — they
    // were never meant to be cached anyway.
    fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' }),
  });
}

export async function captureServerEvent({ distinctId, event, properties }) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.capture({ distinctId, event, properties });
  } finally {
    await posthog.shutdown();
  }
}

export async function captureServerException(error, distinctId, properties) {
  const posthog = getPostHogClient();
  if (!posthog) return;

  try {
    posthog.captureException(error, distinctId, properties);
  } finally {
    await posthog.shutdown();
  }
}

// ---------------------------------------------------------------------------
// Remote config: app access mode + homepage trending playlist.
//
// Deliberately separate from getPostHogClient()'s dev-mode throw above.
// That throw exists so missing analytics config fails loudly instead of
// silently dropping events (see COMMANDMENTS) — the right call for capture.
// It is NOT the right call for routing: a missing/misconfigured PostHog key
// must never be able to take the homepage or /bracket down. Every function
// below wraps that throw and falls back to a safe default instead.
//
// Both flags are global app config, not per-visitor targeting — they're
// evaluated against one fixed synthetic distinct ID rather than each
// visitor's real one, so "100% rollout" == "always on" deterministically.
// ---------------------------------------------------------------------------

const GLOBAL_CONFIG_DISTINCT_ID = 'app-global-config';

export const APP_ACCESS_MODE_FLAG_KEY = 'app-access-mode';
export const TRENDING_PLAYLIST_FLAG_KEY = 'homepage-trending-playlist';

const ACCESS_MODES = ['waitlist-only', 'hero-only', 'unlocked'];
const DEFAULT_ACCESS_MODE = 'hero-only';

const ACCESS_MODE_CACHE_MS = 30_000;
const PLAYLIST_CACHE_MS = 60_000;

// Tiny in-memory, per-server-process cache. Best-effort by design: it resets
// on a cold serverless start (costs one extra PostHog call, nothing more)
// and saves a network round trip on every request in between on a warm
// process — which is exactly the case for `proxy.js` running under the
// Node.js middleware runtime.
let accessModeCache = { value: null, expiresAt: 0 };
let playlistCache = { value: null, expiresAt: 0 };

function safeGetPostHogClient() {
  try {
    return getPostHogClient();
  } catch (e) {
    return { error: e.message };
  }
}

/**
 * Single shared evaluation path used by both public getters below AND the
 * debug route (see app/api/debug/flags/route.js). Always hits PostHog fresh
 * — callers own their own caching. Never throws; errors come back on the
 * result so callers (and the debug route) can see exactly what happened
 * instead of a silent fallback with no explanation.
 */
async function evaluateFlag(flagKey) {
  const clientOrError = safeGetPostHogClient();
  if (!clientOrError) return { error: 'PostHog is not configured (missing env vars) — using fallback.' };
  if (clientOrError.error) return { error: `PostHog client failed to initialize: ${clientOrError.error}` };

  const posthog = clientOrError;
  try {
    const flags = await posthog.evaluateFlags(GLOBAL_CONFIG_DISTINCT_ID, { flagKeys: [flagKey] });
    return { raw: flags.getFlag(flagKey), payload: flags.getFlagPayload(flagKey) };
  } catch (e) {
    return { error: e.message };
  } finally {
    await posthog.shutdown().catch(() => {});
  }
}

/**
 * Resolves the 3-way app access mode from the `app-access-mode` multivariate
 * flag: 'waitlist-only' | 'hero-only' | 'unlocked'. Falls back to
 * 'hero-only' if PostHog is unreachable, unconfigured, or the flag doesn't
 * exist/resolve to a recognized value yet. Pass `{ bypassCache: true }` to
 * force a fresh network evaluation, skipping the 30s in-memory cache.
 */
export async function getAppAccessMode({ bypassCache = false } = {}) {
  if (!bypassCache && Date.now() < accessModeCache.expiresAt) return accessModeCache.value;

  const { raw, error } = await evaluateFlag(APP_ACCESS_MODE_FLAG_KEY);
  if (error) console.error(`Failed to evaluate "${APP_ACCESS_MODE_FLAG_KEY}" flag, defaulting to "${DEFAULT_ACCESS_MODE}":`, error);
  const resolved = ACCESS_MODES.includes(raw) ? raw : DEFAULT_ACCESS_MODE;
  if (!bypassCache) accessModeCache = { value: resolved, expiresAt: Date.now() + ACCESS_MODE_CACHE_MS };
  return resolved;
}

/**
 * Resolves the homepage's live teaser playlist ID from the
 * `homepage-trending-playlist` flag's payload (a plain string, or an object
 * shaped like { playlistId: "..." }). Falls back to `fallbackPlaylistId`
 * (pass TRENDING_PLAYLIST_ID from lib/spotifyAuth.js) if the flag is off,
 * unset, or PostHog can't be reached. Pass `{ bypassCache: true }` to force
 * a fresh network evaluation, skipping the 60s in-memory cache.
 */
export async function getTrendingPlaylistId(fallbackPlaylistId, { bypassCache = false } = {}) {
  if (!bypassCache && Date.now() < playlistCache.expiresAt) return playlistCache.value || fallbackPlaylistId;

  const { payload, error } = await evaluateFlag(TRENDING_PLAYLIST_FLAG_KEY);
  if (error) console.error(`Failed to evaluate "${TRENDING_PLAYLIST_FLAG_KEY}" flag, using fallback playlist:`, error);
  const id =
    typeof payload === 'string'
      ? payload.trim()
      : payload && typeof payload === 'object' && typeof payload.playlistId === 'string'
        ? payload.playlistId.trim()
        : null;
  if (!bypassCache) playlistCache = { value: id || null, expiresAt: Date.now() + PLAYLIST_CACHE_MS };
  return id || fallbackPlaylistId;
}

/**
 * Diagnostic-only: evaluates both flags fresh (no cache) and returns raw
 * results including any error message, so a debug route can show exactly
 * what PostHog is returning right now. See app/api/debug/flags/route.js —
 * delete that route once you've confirmed flags are resolving correctly.
 */
export async function debugEvaluateFlags() {
  const [accessMode, playlist] = await Promise.all([
    evaluateFlag(APP_ACCESS_MODE_FLAG_KEY),
    evaluateFlag(TRENDING_PLAYLIST_FLAG_KEY),
  ]);
  return {
    posthogConfigured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN && process.env.NEXT_PUBLIC_POSTHOG_HOST),
    posthogHost: process.env.NEXT_PUBLIC_POSTHOG_HOST || null,
    distinctIdUsed: GLOBAL_CONFIG_DISTINCT_ID,
    [APP_ACCESS_MODE_FLAG_KEY]: {
      rawValue: accessMode.raw ?? null,
      recognized: ACCESS_MODES.includes(accessMode.raw),
      resolvedTo: ACCESS_MODES.includes(accessMode.raw) ? accessMode.raw : DEFAULT_ACCESS_MODE,
      error: accessMode.error ?? null,
    },
    [TRENDING_PLAYLIST_FLAG_KEY]: {
      rawPayload: playlist.payload ?? null,
      error: playlist.error ?? null,
    },
  };
}
