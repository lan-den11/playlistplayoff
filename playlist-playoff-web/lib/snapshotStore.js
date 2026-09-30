import { createHash } from 'node:crypto';
import { getPool, ensureTable } from './db';

const store = (globalThis.__snapshotStore ??= { cache: new Map() });
const MEMORY_TTL_MS = 5 * 60 * 1000;
const MAX_CACHED = 100;

function fromRow(r) {
  return {
    playlistId: r.playlist_id,
    playlistName: r.playlist_name,
    tracks: r.tracks,
    spotifySnapshotId: r.spotify_snapshot_id,
    contentHash: r.content_hash,
    version: r.version,
    windowKey: r.window_key,
    changedWindowKey: r.changed_window_key,
    checkedAt: new Date(r.checked_at).getTime(),
    takenAt: new Date(r.taken_at).getTime(),
  };
}

function remember(playlistId, snapshot) {
  store.cache.delete(playlistId);
  store.cache.set(playlistId, { snapshot, expiresAt: Date.now() + MEMORY_TTL_MS });
  while (store.cache.size > MAX_CACHED) store.cache.delete(store.cache.keys().next().value);
}

export async function readSnapshot(playlistId) {
  const hit = store.cache.get(playlistId);
  if (hit && hit.expiresAt > Date.now()) return hit.snapshot;
  const pool = getPool();
  if (!pool) return null;
  try {
    await ensureTable();
    const result = await pool.query('SELECT * FROM playlist_snapshots WHERE playlist_id = $1', [playlistId]);
    const snapshot = result.rows[0] ? fromRow(result.rows[0]) : null;
    remember(playlistId, snapshot);
    return snapshot;
  } catch (e) {
    console.error('Snapshot read failed:', e.message);
    return null;
  }
}

export async function saveSnapshot({ playlistId, playlistName, tracks, spotifySnapshotId, windowKey }) {
  const pool = getPool();
  if (!pool) return null;
  await ensureTable();

  const contentHash = createHash('sha1')
    .update(tracks.map((t) => t.id).join(','))
    .digest('hex');
  const prevResult = await pool.query(
    'SELECT content_hash, version, changed_window_key, taken_at FROM playlist_snapshots WHERE playlist_id = $1',
    [playlistId]
  );
  const prev = prevResult.rows[0];
  const changed = !prev || prev.content_hash !== contentHash;
  const version = !prev ? 1 : changed ? prev.version + 1 : prev.version;
  const changedWindowKey = changed ? windowKey : prev.changed_window_key;

  await pool.query(
    `INSERT INTO playlist_snapshots
       (playlist_id, playlist_name, tracks, spotify_snapshot_id, content_hash, version, window_key, changed_window_key, checked_at, taken_at)
     VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, now(), now())
     ON CONFLICT (playlist_id) DO UPDATE SET
       playlist_name = $2,
       tracks = $3::jsonb,
       spotify_snapshot_id = $4,
       content_hash = $5,
       version = $6,
       window_key = $7,
       changed_window_key = $8,
       checked_at = now(),
       taken_at = CASE WHEN $9::boolean THEN now() ELSE playlist_snapshots.taken_at END`,
    [playlistId, playlistName, JSON.stringify(tracks), spotifySnapshotId, contentHash, version, windowKey, changedWindowKey, changed]
  );

  const now = Date.now();
  const snapshot = {
    playlistId,
    playlistName,
    tracks,
    spotifySnapshotId,
    contentHash,
    version,
    windowKey,
    changedWindowKey,
    checkedAt: now,
    takenAt: changed || !prev ? now : new Date(prev.taken_at).getTime(),
  };
  remember(playlistId, snapshot);
  return { snapshot, changed };
}
