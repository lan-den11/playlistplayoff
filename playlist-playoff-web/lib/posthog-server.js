import { PostHog } from 'posthog-node';

let cachedClient;

function buildClient() {
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

export function getPostHogClient() {
  if (cachedClient === undefined) cachedClient = buildClient();
  return cachedClient;
}

let shutdownHooked = false;
function hookShutdown() {
  if (shutdownHooked) return;
  shutdownHooked = true;
  const shutdown = () => cachedClient?.shutdown().catch(() => {});
  process.once('beforeExit', shutdown);
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

export async function captureServerEvent({ distinctId, event, properties }) {
  const posthog = getPostHogClient();
  if (!posthog) return;
  hookShutdown();
  posthog.capture({ distinctId, event, properties });
}

export async function captureServerException(error, distinctId, properties) {
  const posthog = getPostHogClient();
  if (!posthog) return;
  hookShutdown();
  posthog.captureException(error, distinctId, properties);
}

const GLOBAL_CONFIG_DISTINCT_ID = 'app-global-config';

export const APP_ACCESS_MODE_FLAG_KEY = 'app-access-mode';
export const TRENDING_PLAYLIST_FLAG_KEY = 'homepage-trending-playlist';

export const GENRE_PLAYLIST_FLAGS = [
  { key: 'hiphop', label: 'Hip-Hop', flagKey: 'homepage-genre-hiphop-playlist' },
  { key: 'pop', label: 'Pop', flagKey: 'homepage-genre-pop-playlist' },
  { key: 'rock', label: 'Rock', flagKey: 'homepage-genre-rock-playlist' },
];

const ACCESS_MODES = ['waitlist-only', 'hero-only', 'unlocked'];
const DEFAULT_ACCESS_MODE = 'hero-only';

const ALL_FLAG_KEYS = [
  APP_ACCESS_MODE_FLAG_KEY,
  TRENDING_PLAYLIST_FLAG_KEY,
  ...GENRE_PLAYLIST_FLAGS.map((g) => g.flagKey),
];
const FLAGS_CACHE_MS = 30_000;

let flagsCache = { value: null, expiresAt: 0 };
let flagsInflight = null;

function safeGetPostHogClient() {
  try {
    return getPostHogClient();
  } catch (e) {
    return { error: e.message };
  }
}

async function evaluateAllFlags() {
  const clientOrError = safeGetPostHogClient();
  if (!clientOrError) return { error: 'PostHog is not configured (missing env vars) — using fallback.' };
  if (clientOrError.error) return { error: `PostHog client failed to initialize: ${clientOrError.error}` };

  hookShutdown();
  try {
    const flags = await clientOrError.evaluateFlags(GLOBAL_CONFIG_DISTINCT_ID, { flagKeys: ALL_FLAG_KEYS });
    return {
      results: Object.fromEntries(
        ALL_FLAG_KEYS.map((key) => [key, { raw: flags.getFlag(key), payload: flags.getFlagPayload(key) }])
      ),
    };
  } catch (e) {
    return { error: e.message };
  }
}

function loadFlags({ bypassCache = false } = {}) {
  if (!bypassCache) {
    if (Date.now() < flagsCache.expiresAt) return Promise.resolve(flagsCache.value);
    if (flagsInflight) return flagsInflight;
  }

  const task = evaluateAllFlags()
    .then((value) => {
      if (value.error) console.error('Failed to evaluate PostHog flags, using fallbacks:', value.error);
      if (!bypassCache) flagsCache = { value, expiresAt: Date.now() + FLAGS_CACHE_MS };
      return value;
    })
    .finally(() => {
      if (flagsInflight === task) flagsInflight = null;
    });
  if (!bypassCache) flagsInflight = task;
  return task;
}

async function flagResult(key, options) {
  const all = await loadFlags(options);
  return all.error ? { error: all.error } : all.results[key];
}

export async function getAppAccessMode({ bypassCache = false } = {}) {
  const { raw } = await flagResult(APP_ACCESS_MODE_FLAG_KEY, { bypassCache });
  return ACCESS_MODES.includes(raw) ? raw : DEFAULT_ACCESS_MODE;
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

async function resolveFlagPlaylistId(flagKey, options) {
  const { payload, error } = await flagResult(flagKey, options);
  return error ? null : parsePlaylistPayload(payload);
}

export async function getTrendingPlaylistId(fallbackPlaylistId, { bypassCache = false } = {}) {
  const id = await resolveFlagPlaylistId(TRENDING_PLAYLIST_FLAG_KEY, { bypassCache });
  return id || fallbackPlaylistId;
}

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
  const all = await loadFlags({ bypassCache: true });
  const pick = (key) => (all.error ? { error: all.error } : all.results[key]);
  const accessMode = pick(APP_ACCESS_MODE_FLAG_KEY);
  const trending = pick(TRENDING_PLAYLIST_FLAG_KEY);
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
    genrePlaylists: GENRE_PLAYLIST_FLAGS.map((g) => {
      const flag = pick(g.flagKey);
      return {
        key: g.key,
        flagKey: g.flagKey,
        rawPayload: flag.payload ?? null,
        resolvedPlaylistId: parsePlaylistPayload(flag.payload),
        error: flag.error ?? null,
      };
    }),
  };
}
