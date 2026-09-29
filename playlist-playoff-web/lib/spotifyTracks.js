import axios from 'axios';
import { getAppToken } from './spotifyAuth';

const cache = (globalThis.__trackStore ??= new Map());
const TTL_MS = 6 * 60 * 60 * 1000;
const MAX_ENTRIES = 200;

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
    cache.set(id, { track, expiresAt: Date.now() + TTL_MS });
    while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
    return track;
  } catch (e) {
    console.error('Share track lookup error:', e.response?.status, e.message);
    return null;
  }
}

export async function getTracksByIds(ids) {
  const token = await getAppToken();
  const headers = { Authorization: `Bearer ${token}` };
  const tracks = await Promise.all([...new Set(ids)].map((id) => fetchTrack(id, headers)));
  return Object.fromEntries(tracks.filter(Boolean).map((t) => [t.id, t]));
}
