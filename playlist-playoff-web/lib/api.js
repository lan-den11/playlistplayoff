async function request(path, options = {}) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export function fetchPlaylistTracks(idOrUrl) {
  return request(`/api/playlist/${encodeURIComponent(idOrUrl)}/tracks`);
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

// Attaches this visitor's own email + Clerk waitlist entry id to the
// referral code they'll be sharing, so a launch-day script can look up whose
// entry to priority-invite for a given code (see /api/admin/top-referrers).
export function registerReferralCode({ code, email, waitlistEntryId }) {
  return request('/api/referral/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, email, waitlistEntryId }),
  }).catch(() => {});
}

// Credits a referral code with one more signup. Fire-and-forget for the same
// reason as bumpMatchupCounter — a tracking hiccup should never block someone
// from joining the waitlist.
export function joinReferral(code) {
  return request('/api/referral/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  }).catch(() => {});
}

export function fetchReferralCount(code) {
  return request(`/api/referral/${encodeURIComponent(code)}`);
}
