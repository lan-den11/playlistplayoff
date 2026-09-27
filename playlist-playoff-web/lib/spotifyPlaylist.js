import axios from 'axios';
import { getAppToken } from './spotifyAuth';

// One store per Node process, pinned to globalThis so the homepage render and
// the /api/playlist route share it even though Next bundles them separately.
const store = (globalThis.__playlistStore ??= { cache: new Map(), inflight: new Map() });

// Increased default TTL to 15 minutes (900,000 ms) to reduce unnecessary API hits
const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 25;

async function fetchPlaylist(playlistId) {
  const token = await getAppToken();
  const headers = { Authorization: `Bearer ${token}` };

  const namePromise = axios
    .get(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name`, { headers })
    .then((r) => r.data.name)
    .catch(() => null);

  const fields = 'total,items(added_at,track(id,uri,name,duration_ms,popularity,artists(name),album(name,release_date,images)))';

  // 1. Fetch first page to get initial items and total track count
  const firstPageResp = await axios.get(
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=0&fields=${fields}`,
    { headers }
  );

  let items = [...(firstPageResp.data?.items || [])];
  const total = firstPageResp.data?.total || items.length;

  // 2. Fetch all remaining pages in parallel instead of sequentially
  if (total > 100) {
    const pageRequests = [];
    for (let offset = 100; offset < total; offset += 100) {
      pageRequests.push(
        axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&offset=${offset}&fields=${fields}`,
          { headers }
        )
      );
    }

    const pages = await Promise.all(pageRequests);
    for (const page of pages) {
      if (page.data?.items) {
        items = items.concat(page.data.items);
      }
    }
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
      imageLarge: t.album?.images?.[0]?.url || t.album?.images?.[t.album.images.length - 1]?.url || null,
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