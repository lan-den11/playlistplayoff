import axios from 'axios';

const store = (globalThis.__lastfmStore ??= { cache: new Map(), timestamps: [], pending: 0 });

const MAX_PER_WINDOW = 5;
const WINDOW_MS = 1000;
const MAX_PENDING = 60;
const MAX_CACHED = 5000;
const TTL_PLAYCOUNT_MS = 30 * 60 * 1000;
const TTL_TAGS_MS = 24 * 60 * 60 * 1000;
const TTL_FAILURE_MS = 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cacheGet(key) {
  const hit = store.cache.get(key);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    store.cache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key, value, ttlMs) {
  store.cache.delete(key);
  store.cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  while (store.cache.size > MAX_CACHED) store.cache.delete(store.cache.keys().next().value);
}

async function acquireSlot() {
  for (;;) {
    const now = Date.now();
    while (store.timestamps.length && now - store.timestamps[0] > WINDOW_MS) {
      store.timestamps.shift();
    }
    if (store.timestamps.length < MAX_PER_WINDOW) {
      store.timestamps.push(now);
      return;
    }
    await sleep(WINDOW_MS - (now - store.timestamps[0]) + 5);
  }
}

export function queueLastfm(taskFn) {
  if (store.pending >= MAX_PENDING) {
    const error = new Error('Last.fm queue is full');
    error.busy = true;
    return Promise.reject(error);
  }
  store.pending += 1;
  return acquireSlot()
    .then(taskFn)
    .finally(() => {
      store.pending -= 1;
    });
}

export async function getLastfmPlaycount(artist, track, username) {
  const key = `pc||${username.toLowerCase()}||${artist.toLowerCase()}||${track.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  try {
    const resp = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getInfo',
        artist,
        track,
        username,
        api_key: process.env.LASTFM_API_KEY,
        format: 'json',
        autocorrect: 1,
      },
      timeout: 8000,
    });
    const raw = resp.data?.track?.userplaycount;
    const value = raw !== undefined ? parseInt(raw, 10) : null;
    cacheSet(key, value, TTL_PLAYCOUNT_MS);
    return value;
  } catch {
    cacheSet(key, null, TTL_FAILURE_MS);
    return null;
  }
}

export async function getLastfmTags(artist, track) {
  const key = `tags||${artist.toLowerCase()}||${track.toLowerCase()}`;
  const cached = cacheGet(key);
  if (cached !== undefined) return cached;
  try {
    const resp = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getTopTags',
        artist,
        track,
        api_key: process.env.LASTFM_API_KEY,
        format: 'json',
        autocorrect: 1,
      },
      timeout: 8000,
    });
    const raw = resp.data?.toptags?.tag;
    const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
    const value = list.slice(0, 3).map((t) => t.name);
    cacheSet(key, value, TTL_TAGS_MS);
    return value;
  } catch {
    cacheSet(key, [], TTL_FAILURE_MS);
    return [];
  }
}
