import { getDistinctId, isCapturingOptedOut } from './posthog-client';

async function request(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

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

export function bumpMatchupCounter() {
  return request('/api/counters/matchup', { method: 'POST' }).catch(() => {});
}

export function fetchMatchupCounter() {
  return request('/api/counters/matchup');
}

export function saveWaitlistSignup({ email, source, turnstileToken }) {
  return request('/api/waitlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      source,
      turnstileToken: turnstileToken || null,
      distinctId: getDistinctId(),
      optedOut: isCapturingOptedOut(),
    }),
  });
}
