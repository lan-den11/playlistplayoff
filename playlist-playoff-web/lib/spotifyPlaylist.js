import axios from 'axios';
import { getAppToken } from './spotifyAuth';
import { readSnapshot } from './snapshotStore';

const store = (globalThis.__playlistStore ??= { cache: new Map(), inflight: new Map() });

const DEFAULT_TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 25;
const PAGE_SIZE = 100;
const MAX_TRACKS = 2000;
const PAGE_CONCURRENCY = 4;
const FALLBACK_STATUSES = [400, 403, 404, 410];

const ENDPOINTS = [
  { path: 'tracks', key: 'track' },
  { path: 'items', key: 'item' },
];

function pageUrl(playlistId, endpoint, offset) {
  const fields = `total,items(added_at,${endpoint.key}(id,uri,name,duration_ms,popularity,artists(name),album(name,release_date,images)))`;
  return `https://api.spotify.com/v1/playlists/${playlistId}/${endpoint.path}?limit=${PAGE_SIZE}&offset=${offset}&fields=${fields}`;
}

async function fetchFirstPage(playlistId, headers) {
  let firstError = null;
  for (const endpoint of ENDPOINTS) {
    try {
      const resp = await axios.get(pageUrl(playlistId, endpoint, 0), { headers });
      return { endpoint, resp };
    } catch (e) {
      firstError ??= e;
      if (!FALLBACK_STATUSES.includes(e.response?.status)) throw e;
    }
  }
  throw firstError;
}

async function fetchPlaylist(playlistId) {
  const token = await getAppToken();
  const headers = { Authorization: `Bearer ${token}` };

  const metaPromise = axios
    .get(`https://api.spotify.com/v1/playlists/${playlistId}?fields=name,snapshot_id`, { headers })
    .then((r) => ({ name: r.data.name ?? null, snapshotId: r.data.snapshot_id ?? null }))
    .catch(() => null);

  const { endpoint, resp: firstPage } = await fetchFirstPage(playlistId, headers);

  let items = [...(firstPage.data?.items || [])];
  const total = Math.min(firstPage.data?.total || items.length, MAX_TRACKS);

  const offsets = [];
  for (let offset = PAGE_SIZE; offset < total; offset += PAGE_SIZE) offsets.push(offset);
  for (let i = 0; i < offsets.length; i += PAGE_CONCURRENCY) {
    const pages = await Promise.all(
      offsets.slice(i, i + PAGE_CONCURRENCY).map((offset) => axios.get(pageUrl(playlistId, endpoint, offset), { headers }))
    );
    for (const page of pages) items = items.concat(page.data?.items || []);
  }

  const tracks = items
    .map((i) => {
      const t = i[endpoint.key] ?? i.track ?? i.item;
      return t ? { ...t, addedAt: i.added_at } : null;
    })
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

  const meta = await metaPromise;
  return { tracks, playlistName: meta?.name ?? null, spotifySnapshotId: meta?.snapshotId ?? null };
}

export function loadLive(playlistId) {
  const pending = store.inflight.get(playlistId);
  if (pending) return pending;
  const request = fetchPlaylist(playlistId).finally(() => {
    store.inflight.delete(playlistId);
  });
  store.inflight.set(playlistId, request);
  return request;
}

export async function getPlaylist(playlistId, { ttlMs = DEFAULT_TTL_MS } = {}) {
  const snapshot = await readSnapshot(playlistId);
  if (snapshot) {
    return {
      tracks: snapshot.tracks,
      playlistName: snapshot.playlistName,
      snapshot: {
        version: snapshot.version,
        takenAt: new Date(snapshot.takenAt).toISOString(),
        windowKey: snapshot.windowKey,
      },
    };
  }

  const hit = store.cache.get(playlistId);
  if (hit && hit.expiresAt > Date.now()) return hit.data;

  const data = await loadLive(playlistId);
  store.cache.delete(playlistId);
  store.cache.set(playlistId, { data, expiresAt: Date.now() + ttlMs });
  while (store.cache.size > MAX_ENTRIES) store.cache.delete(store.cache.keys().next().value);
  return data;
}

export function warmPlaylist(playlistId, ttlMs) {
  getPlaylist(playlistId, { ttlMs }).catch(() => {});
}
