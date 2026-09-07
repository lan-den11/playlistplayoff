'use client';

import { useCallback, useRef, useState } from 'react';
import { fetchLastfmPlaycount } from '../lib/api';

const STORAGE_KEY = 'lastfmUsernameOverride';

function readStoredUsername() {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Background Last.fm play-count fetcher. Tracks are enqueued (typically in
 * bracket-appearance order) and fetched one at a time — the actual 5 req/sec
 * throttling already lives server-side in Express, this just avoids firing
 * dozens of concurrent requests from the client for no reason.
 */
export function useLastfmData() {
  const [data, setData] = useState({}); // trackId -> { status, playcount, tags }
  const [enabled, setEnabled] = useState(true);
  const queueRef = useRef([]);
  const queuedIdsRef = useRef(new Set());
  const runningRef = useRef(false);
  const [usernameOverride, setUsernameOverrideState] = useState(readStoredUsername);

  const setUsernameOverride = useCallback((value) => {
    setUsernameOverrideState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // storage unavailable — not critical
    }
  }, []);

  const runQueue = useCallback(async (username) => {
    if (runningRef.current) return;
    runningRef.current = true;
    while (queueRef.current.length) {
      const track = queueRef.current.shift();
      setData((prev) => ({ ...prev, [track.id]: { status: 'loading', playcount: null, tags: [] } }));
      try {
        const primaryArtist = track.artists.split(',')[0].trim();
        const res = await fetchLastfmPlaycount(primaryArtist, track.name, username);
        setEnabled(res.enabled);
        setData((prev) => ({
          ...prev,
          [track.id]: { status: 'ready', playcount: res.playcount, tags: res.tags || [] },
        }));
      } catch {
        setData((prev) => ({ ...prev, [track.id]: { status: 'ready', playcount: null, tags: [] } }));
      }
    }
    runningRef.current = false;
  }, []);

  const enqueueTracks = useCallback(
    (tracks) => {
      const fresh = tracks.filter((t) => !queuedIdsRef.current.has(t.id));
      if (!fresh.length) return;
      fresh.forEach((t) => queuedIdsRef.current.add(t.id));
      setData((prev) => {
        const next = { ...prev };
        fresh.forEach((t) => {
          if (!next[t.id]) next[t.id] = { status: 'pending', playcount: null, tags: [] };
        });
        return next;
      });
      queueRef.current.push(...fresh);
      runQueue(usernameOverride);
    },
    [runQueue, usernameOverride]
  );

  return { lastfmData: data, lastfmEnabled: enabled, enqueueTracks, usernameOverride, setUsernameOverride };
}
