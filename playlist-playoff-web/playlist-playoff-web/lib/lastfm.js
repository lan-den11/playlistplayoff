import axios from 'axios';

const lastfmCache = new Map();
const requestTimestamps = [];
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireSlot() {
  for (;;) {
    const now = Date.now();
    while (requestTimestamps.length && now - requestTimestamps[0] > WINDOW_MS) {
      requestTimestamps.shift();
    }
    if (requestTimestamps.length < MAX_PER_WINDOW) {
      requestTimestamps.push(now);
      return;
    }
    await sleep(WINDOW_MS - (now - requestTimestamps[0]) + 5);
  }
}

export function queueLastfm(taskFn) {
  return acquireSlot().then(taskFn);
}

export async function getLastfmPlaycount(artist, track, username) {
  const key = `pc||${username.toLowerCase()}||${artist.toLowerCase()}||${track.toLowerCase()}`;
  if (lastfmCache.has(key)) return lastfmCache.get(key);
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
    lastfmCache.set(key, value);
    return value;
  } catch {
    lastfmCache.set(key, null);
    return null;
  }
}

export async function getLastfmTags(artist, track) {
  const key = `tags||${artist.toLowerCase()}||${track.toLowerCase()}`;
  if (lastfmCache.has(key)) return lastfmCache.get(key);
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
    lastfmCache.set(key, value);
    return value;
  } catch {
    lastfmCache.set(key, []);
    return [];
  }
}
