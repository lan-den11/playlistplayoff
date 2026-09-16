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
    featureFlagsRequestTimeoutMs: 2000,
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

const GLOBAL_CONFIG_DISTINCT_ID = 'app-global-config';

export const APP_ACCESS_MODE_FLAG_KEY = 'app-access-mode';
export const TRENDING_PLAYLIST_FLAG_KEY = 'homepage-trending-playlist';

const ACCESS_MODES = ['waitlist-only', 'hero-only', 'unlocked'];
const DEFAULT_ACCESS_MODE = 'hero-only';

const ACCESS_MODE_CACHE_MS = 30_000;
const PLAYLIST_CACHE_MS = 60_000;

let accessModeCache = { value: null, expiresAt: 0 };
let playlistCache = { value: null, expiresAt: 0 };

function safeGetPostHogClient() {
  try {
    return getPostHogClient();
  } catch (e) {
    return { error: e.message };
  }
}

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

export async function getAppAccessMode({ bypassCache = false } = {}) {
  if (!bypassCache && Date.now() < accessModeCache.expiresAt) return accessModeCache.value;

  const { raw, error } = await evaluateFlag(APP_ACCESS_MODE_FLAG_KEY);
  if (error) console.error(`Failed to evaluate "${APP_ACCESS_MODE_FLAG_KEY}" flag, defaulting to "${DEFAULT_ACCESS_MODE}":`, error);
  const resolved = ACCESS_MODES.includes(raw) ? raw : DEFAULT_ACCESS_MODE;
  if (!bypassCache) accessModeCache = { value: resolved, expiresAt: Date.now() + ACCESS_MODE_CACHE_MS };
  return resolved;
}

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
