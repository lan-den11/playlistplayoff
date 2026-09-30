import axios from 'axios';
import { getAppToken } from './spotifyAuth';

const cache = (globalThis.__trackStore ??= new Map());
const TTL_MS = 6 * 60 * 60 * 1000;
const MISSING_TTL_MS = 10 * 60 * 1000;
const ERROR_TTL_MS = 30 * 1000;
const MAX_ENTRIES = 200;

function remember(id, track, ttlMs) {
  cache.delete(id);
  cache.set(id, { track, expiresAt: Date.now() + ttlMs });
  while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
}

async function fetchTrack(id, headers) {
  const hit = cache.get(id);
  if (hit && hit.expiresAt > Date.now()) return hit.track;
  try {
    const { data: t } = await axios.get(`https://api.spotify.com/v1/tracks/${id}`, { headers, timeout: 8000 });
    const images = t.album?.images || [];
    const track = {
      id: t.id,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      image: images[images.length - 1]?.url || null,
      imageLarge: images[0]?.url || null,
    };
    remember(id, track, TTL_MS);
    return track;
  } catch (e) {
    const status = e.response?.status;
    console.error('Share track lookup error:', status, e.message);
    remember(id, null, status === 400 || status === 404 ? MISSING_TTL_MS : ERROR_TTL_MS);
    return null;
  }
}

export async function getTracksByIds(ids) {
  const token = await getAppToken();
  const headers = { Authorization: `Bearer ${token}` };
  const tracks = await Promise.all([...new Set(ids)].map((id) => fetchTrack(id, headers)));
  return Object.fromEntries(tracks.filter(Boolean).map((t) => [t.id, t]));
}
