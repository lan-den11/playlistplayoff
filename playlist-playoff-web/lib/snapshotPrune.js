import { getPool, ensureTable } from './db';

const MAX_AGE_DAYS = 10;

export async function pruneStaleSnapshots(activeIds) {
  const pool = getPool();
  if (!pool || !activeIds.length) return 0;
  await ensureTable();
  const result = await pool.query(
    `DELETE FROM playlist_snapshots
     WHERE playlist_id <> ALL($1::text[]) AND checked_at < now() - make_interval(days => $2::int)
     RETURNING playlist_id`,
    [activeIds, MAX_AGE_DAYS]
  );
  const cache = globalThis.__snapshotStore?.cache;
  result.rows.forEach((r) => cache?.delete(r.playlist_id));
  return result.rowCount;
}
