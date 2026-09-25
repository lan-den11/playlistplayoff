async function request(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// Per-tab playlist cache, keyed by playlist id/url — flipping back to a
// genre you've already opened this session is instant, with zero requests.
// Failures are never cached, same rule as the server-side cache.
const playlistCache = new Map();

export function fetchPlaylistTracks(idOrUrl) {
  const cached = playlistCache.get(idOrUrl);
  if (cached) return Promise.resolve(cached);
  return request(`/api/playlist/${encodeURIComponent(idOrUrl)}/tracks`).then((data) => {
    playlistCache.set(idOrUrl, data);
    return data;
  });
}

export function fetchUserPlaylists(username) {
  return request(`/api/user/${encodeURIComponent(username)}/playlists`);
}

export function fetchLastfmPlaycount(artist, track, username) {
  const params = new URLSearchParams({ artist, track });
  if (username) params.set('username', username);
  return request(`/api/lastfm/playcount?${params.toString()}`);
}

export function fetchProfile() {
  return request('/api/profile');
}

export function saveProfile(payload) {
  return request('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function fetchAlbumArt(artist, album) {
  const params = new URLSearchParams({ artist, album });
  return request(`/api/album-art?${params.toString()}`);
}

// Fire-and-forget global "matchups decided" counter. Never throws — a failed
// bump should never interrupt someone picking a winner. No-ops server-side
// when DATABASE_URL isn't configured (see app/api/counters/matchup/route.js).
export function bumpMatchupCounter() {
  return request('/api/counters/matchup', { method: 'POST' }).catch(() => {});
}

export function fetchMatchupCounter() {
  return request('/api/counters/matchup');
}

// Fire-and-forget copy of a waitlist signup into our own Supabase-backed
// table (see app/api/waitlist/route.js) — a plain list of emails + when
// they signed up, independent of Clerk's own waitlist records.
export function saveWaitlistSignup({ email, source }) {
  return request('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, source }),
  }).catch(() => {});
}
