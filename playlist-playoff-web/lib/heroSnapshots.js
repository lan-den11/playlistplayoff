import { getPool } from './db';
import { readSnapshot, saveSnapshot } from './snapshotStore';
import { pruneStaleSnapshots } from './snapshotPrune';
import { loadLive } from './spotifyPlaylist';
import { TRENDING_PLAYLIST_ID } from './spotifyAuth';
import { getTrendingPlaylistId, getGenrePlaylists, captureServerEvent } from './posthog-server';

const TIME_ZONE = 'America/Chicago';
const REFRESH_AT_MINUTES = 7 * 60;
const RETRY_WINDOW_MINUTES = 6 * 60;
const RETRY_EVERY_MS = 30 * 60 * 1000;
const FAILURE_BACKOFF_MS = 5 * 60 * 1000;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const PRUNE_EVERY_MS = 60 * 60 * 1000;
const WEEKDAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const state = (globalThis.__heroSnapshotState ??= { inflight: new Map(), lastAttempt: new Map(), timer: null, lastPrune: 0 });

const formatter = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function currentWindow(now = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(now).map((p) => [p.type, p.value]));
  const minutes = Number(parts.hour) * 60 + Number(parts.minute);
  let daysBack = (WEEKDAYS[parts.weekday] - 5 + 7) % 7;
  if (daysBack === 0 && minutes < REFRESH_AT_MINUTES) daysBack = 7;
  const start = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day) - daysBack));
  return {
    key: start.toISOString().slice(0, 10),
    minutesIntoWindow: daysBack === 0 ? minutes - REFRESH_AT_MINUTES : null,
  };
}

function needsRefresh(snapshot, now) {
  if (!snapshot) return true;
  const { key, minutesIntoWindow } = currentWindow(now);
  if (snapshot.windowKey !== key) return true;
  const unchangedThisWindow = snapshot.changedWindowKey !== key;
  return (
    unchangedThisWindow &&
    minutesIntoWindow !== null &&
    minutesIntoWindow < RETRY_WINDOW_MINUTES &&
    now.getTime() - snapshot.checkedAt > RETRY_EVERY_MS
  );
}

async function refreshSnapshot(playlistId, windowKey) {
  const live = await loadLive(playlistId);
  const saved = await saveSnapshot({
    playlistId,
    playlistName: live.playlistName,
    tracks: live.tracks,
    spotifySnapshotId: live.spotifySnapshotId,
    windowKey,
  });
  if (!saved) return null;

  const { snapshot, changed } = saved;
  console.log(
    `[hero-snapshot] ${playlistId} v${snapshot.version} ${changed ? 'CHANGED' : 'unchanged'} tracks=${snapshot.tracks.length} window=${windowKey}`
  );
  captureServerEvent({
    distinctId: 'app-global-config',
    event: 'hero_playlist_snapshot',
    properties: {
      playlist_id: playlistId,
      version: snapshot.version,
      changed,
      track_count: snapshot.tracks.length,
      window_key: windowKey,
      $process_person_profile: false,
    },
  }).catch(() => {});
  return snapshot;
}

export function ensureHeroSnapshot(playlistId) {
  if (!playlistId || !getPool()) return Promise.resolve(null);
  const pending = state.inflight.get(playlistId);
  if (pending) return pending;

  const task = (async () => {
    const now = new Date();
    const snapshot = await readSnapshot(playlistId);
    if (!needsRefresh(snapshot, now)) return snapshot;
    if (now.getTime() - (state.lastAttempt.get(playlistId) || 0) < FAILURE_BACKOFF_MS) return snapshot;
    state.lastAttempt.set(playlistId, now.getTime());
    try {
      return (await refreshSnapshot(playlistId, currentWindow(now).key)) ?? snapshot;
    } catch (e) {
      console.error(`[hero-snapshot] refresh failed for ${playlistId}, keeping previous snapshot:`, e.message);
      return snapshot;
    }
  })().finally(() => {
    state.inflight.delete(playlistId);
  });

  state.inflight.set(playlistId, task);
  return task;
}

async function resolveHeroIds() {
  const [trending, genres] = await Promise.all([getTrendingPlaylistId(TRENDING_PLAYLIST_ID), getGenrePlaylists()]);
  return [trending, ...genres.map((g) => g.playlistId)];
}

function startScheduler() {
  if (state.timer) return;
  state.timer = setInterval(() => {
    syncHeroSnapshots().catch(() => {});
  }, CHECK_INTERVAL_MS);
  state.timer.unref?.();
}

async function pruneOld(activeIds, snapshots) {
  if (!activeIds.length || !snapshots.every(Boolean)) return;
  if (Date.now() - (state.lastPrune || 0) < PRUNE_EVERY_MS) return;
  state.lastPrune = Date.now();
  try {
    const removed = await pruneStaleSnapshots(activeIds);
    if (removed) console.log(`[hero-snapshot] pruned ${removed} stale snapshot row(s)`);
  } catch (e) {
    console.error('[hero-snapshot] prune failed:', e.message);
  }
}

export async function syncHeroSnapshots(ids) {
  startScheduler();
  const list = ids ?? (await resolveHeroIds());
  const activeIds = [...new Set(list.filter(Boolean))];
  const snapshots = await Promise.all(activeIds.map(ensureHeroSnapshot));
  await pruneOld(activeIds, snapshots);
}
