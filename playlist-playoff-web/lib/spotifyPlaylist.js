import axios from 'axios';
import { getAppToken } from './spotifyAuth';

// One store per Node process, pinned to globalThis so the homepage render and
// the /api/playlist route share it even though Next bundles them separately.
const store = (globalThis.__playlistStore ??= { cache: new Map(), inflight: new Map() });

// Short by default so someone editing their own playlist and reloading sees
// the change. The homepage passes a longer TTL for the trending playlist.
const DEFAULT_TTL_MS = 60_000;
const MAX_ENTRIES = 25;

async function fetchPlaylist(playlistId) {
  const token = await getAppToken();
  const headers = { Authorization: `Bearer ${token}` };

  const namePromise = axios
    .get(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name`, { headers })
    .then((r) => r.data.name)
    .catch(() => null);

  let items = [];
  let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,items(added_at,track(id,uri,name,duration_ms,popularity,artists(name),album(name,release_date,images)))`;
  while (url) {
    const resp = await axios.get(url, { headers });
    items = items.concat(resp.data.items);
    url = resp.data.next;
  }

  const tracks = items
    .map((i) => (i.track ? { ...i.track, addedAt: i.added_at } : null))
    .filter((t) => t && t.id)
    .map((t) => ({
      id: t.id,
      uri: t.uri,
      name: t.name,
      artists: t.artists.map((a) => a.name).join(', '),
      image: t.album?.images?.[t.album.images.length - 1]?.url || t.album?.images?.[0]?.url || null,
      popularity: t.popularity,
      addedAt: t.addedAt,
      albumName: t.album?.name || null,
      releaseYear: t.album?.release_date ? t.album.release_date.slice(0, 4) : null,
    }));

  return { tracks, playlistName: await namePromise };
}

// Resolves to { tracks, playlistName }. Rejects with the original axios error
// (callers read e.response?.status). Failures are never cached.
export function getPlaylist(playlistId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const hit = store.cache.get(playlistId);
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.data);

  const pending = store.inflight.get(playlistId);
  if (pending) return pending;

  const request = fetchPlaylist(playlistId)
    .then((data) => {
      store.cache.delete(playlistId);
      store.cache.set(playlistId, { data, expiresAt: Date.now() + ttlMs });
      while (store.cache.size > MAX_ENTRIES) store.cache.delete(store.cache.keys().next().value);
      return data;
    })
    .finally(() => {
      store.inflight.delete(playlistId);
    });

  store.inflight.set(playlistId, request);
  return request;
}

// Fire-and-forget: start (or join) the fetch so it's ready by the time the
// browser asks for it. Errors surface later on the real request.
export function warmPlaylist(playlistId, ttlMs) {
  getPlaylist(playlistId, { ttlMs }).catch(() => {});
}
