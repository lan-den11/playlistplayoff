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
    console.error('PostHog client unavailable for remote config, using default:', e.message);
    return null;
  }
}

/**
 * Resolves the 3-way app access mode from the `app-access-mode` multivariate
 * flag: 'waitlist-only' | 'hero-only' | 'unlocked'. Falls back to
 * 'hero-only' if PostHog is unreachable, unconfigured, or the flag doesn't
 * exist/resolve to a recognized value yet.
 */
export async function getAppAccessMode() {
  if (Date.now() < accessModeCache.expiresAt) return accessModeCache.value;

  const posthog = safeGetPostHogClient();
  if (!posthog) return DEFAULT_ACCESS_MODE;

  try {
    const flags = await posthog.evaluateFlags(GLOBAL_CONFIG_DISTINCT_ID, {
      flagKeys: [APP_ACCESS_MODE_FLAG_KEY],
    });
    const raw = flags.getFlag(APP_ACCESS_MODE_FLAG_KEY);
    const resolved = ACCESS_MODES.includes(raw) ? raw : DEFAULT_ACCESS_MODE;
    accessModeCache = { value: resolved, expiresAt: Date.now() + ACCESS_MODE_CACHE_MS };
    return resolved;
  } catch (e) {
    console.error(`Failed to evaluate "${APP_ACCESS_MODE_FLAG_KEY}" flag, defaulting to "${DEFAULT_ACCESS_MODE}":`, e.message);
    return DEFAULT_ACCESS_MODE;
  } finally {
    await posthog.shutdown().catch(() => {});
  }
}

/**
 * Resolves the homepage's live teaser playlist ID from the
 * `homepage-trending-playlist` flag's payload (a plain string, or an object
 * shaped like { playlistId: "..." }). Falls back to `fallbackPlaylistId`
 * (pass TRENDING_PLAYLIST_ID from lib/spotifyAuth.js) if the flag is off,
 * unset, or PostHog can't be reached.
 */
export async function getTrendingPlaylistId(fallbackPlaylistId) {
  if (Date.now() < playlistCache.expiresAt) return playlistCache.value || fallbackPlaylistId;

  const posthog = safeGetPostHogClient();
  if (!posthog) return fallbackPlaylistId;

  try {
    const flags = await posthog.evaluateFlags(GLOBAL_CONFIG_DISTINCT_ID, {
      flagKeys: [TRENDING_PLAYLIST_FLAG_KEY],
    });
    const payload = flags.getFlagPayload(TRENDING_PLAYLIST_FLAG_KEY);
    const id =
      typeof payload === 'string'
        ? payload.trim()
        : payload && typeof payload === 'object' && typeof payload.playlistId === 'string'
          ? payload.playlistId.trim()
          : null;
    playlistCache = { value: id || null, expiresAt: Date.now() + PLAYLIST_CACHE_MS };
    return id || fallbackPlaylistId;
  } catch (e) {
    console.error(`Failed to evaluate "${TRENDING_PLAYLIST_FLAG_KEY}" flag, using fallback playlist:`, e.message);
    return fallbackPlaylistId;
  } finally {
    await posthog.shutdown().catch(() => {});
  }
}
