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

// One flag per genre tab. Each flag's payload is just the playlist's Spotify
// URL or bare ID, pasted in as plain text — same format as the trending
// flag already uses. A genre only appears in the homepage toggle once its
// flag has a non-empty payload; leave a flag unset (or its payload blank) to
// keep that tab hidden. "Trending" is not in this list because it always
// shows, with TRENDING_PLAYLIST_ID as its hardcoded fallback.
export const GENRE_PLAYLIST_FLAGS = [
  { key: 'hiphop', label: 'Hip-Hop', flagKey: 'homepage-genre-hiphop-playlist' },
  { key: 'pop', label: 'Pop', flagKey: 'homepage-genre-pop-playlist' },
  { key: 'rock', label: 'Rock', flagKey: 'homepage-genre-rock-playlist' },
];

const ACCESS_MODES = ['waitlist-only', 'hero-only', 'unlocked'];
const DEFAULT_ACCESS_MODE = 'hero-only';

const ACCESS_MODE_CACHE_MS = 30_000;
const PLAYLIST_CACHE_MS = 60_000;

let accessModeCache = { value: null, expiresAt: 0 };
// One cache entry per flag key (trending + each genre), same TTL/shape as
// the old single `playlistCache` this replaces.
const playlistCaches = new Map();

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

function parsePlaylistPayload(payload) {
  const id =
    typeof payload === 'string'
      ? payload.trim()
      : payload && typeof payload === 'object' && typeof payload.playlistId === 'string'
        ? payload.playlistId.trim()
        : null;
  return id || null;
}

// Shared resolver behind getTrendingPlaylistId and getGenrePlaylists. Returns
// the raw playlist ID/URL string from the flag's payload, or null if the
// flag is unset/empty/erroring — callers decide what null means for them
// (trending falls back to a hardcoded ID; genres just get hidden).
async function resolveFlagPlaylistId(flagKey, { bypassCache = false } = {}) {
  const cached = playlistCaches.get(flagKey);
  if (!bypassCache && cached && Date.now() < cached.expiresAt) return cached.value;

  const { payload, error } = await evaluateFlag(flagKey);
  if (error) console.error(`Failed to evaluate "${flagKey}" flag:`, error);
  const id = error ? null : parsePlaylistPayload(payload);
  if (!bypassCache) playlistCaches.set(flagKey, { value: id, expiresAt: Date.now() + PLAYLIST_CACHE_MS });
  return id;
}

export async function getTrendingPlaylistId(fallbackPlaylistId, { bypassCache = false } = {}) {
  const id = await resolveFlagPlaylistId(TRENDING_PLAYLIST_FLAG_KEY, { bypassCache });
  return id || fallbackPlaylistId;
}

// Resolves every genre flag in parallel and returns only the ones an admin
// has actually configured — that's what makes an unset flag disappear from
// the homepage toggle instead of showing an empty/broken tab.
export async function getGenrePlaylists({ bypassCache = false } = {}) {
  const resolved = await Promise.all(
    GENRE_PLAYLIST_FLAGS.map(async (genre) => ({
      ...genre,
      playlistId: await resolveFlagPlaylistId(genre.flagKey, { bypassCache }),
    }))
  );
  return resolved.filter((genre) => Boolean(genre.playlistId));
}

export async function debugEvaluateFlags() {
  const [accessMode, trending, ...genres] = await Promise.all([
    evaluateFlag(APP_ACCESS_MODE_FLAG_KEY),
    evaluateFlag(TRENDING_PLAYLIST_FLAG_KEY),
    ...GENRE_PLAYLIST_FLAGS.map((g) => evaluateFlag(g.flagKey)),
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
      rawPayload: trending.payload ?? null,
      resolvedPlaylistId: parsePlaylistPayload(trending.payload),
      error: trending.error ?? null,
    },
    genrePlaylists: GENRE_PLAYLIST_FLAGS.map((g, i) => ({
      key: g.key,
      flagKey: g.flagKey,
      rawPayload: genres[i].payload ?? null,
      resolvedPlaylistId: parsePlaylistPayload(genres[i].payload),
      error: genres[i].error ?? null,
    })),
  };
}
