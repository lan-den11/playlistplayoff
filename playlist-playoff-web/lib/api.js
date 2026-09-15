// One fetch can be rejected at the transport layer before any response
// arrives — a dropped connection, a DNS blip, or Mobile Safari's
// "TypeError: Load failed". Those are transient, so retry a bounded number of
// times with a growing backoff. A response we could read (even a 4xx/5xx) is
// a real answer from the server, so it is never retried here.
const MAX_RETRIES = 2; // total attempts = MAX_RETRIES + 1
const RETRY_BASE_DELAY_MS = 400;
const REQUEST_TIMEOUT_MS = 8000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// `fetch` rejects with a TypeError when the request never reaches the server;
// a slow request that we abort rejects with an AbortError. Both are transport
// failures worth another attempt. An Error thrown from a non-ok response is
// not, so it falls through and is surfaced to the caller unchanged.
function isTransientNetworkError(err) {
  return err instanceof TypeError || err.name === 'AbortError';
}

async function request(path, options = {}) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(path, { ...options, signal: controller.signal });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      return data;
    } catch (err) {
      if (!isTransientNetworkError(err)) throw err;
      lastError = err;
      if (attempt < MAX_RETRIES) await delay(RETRY_BASE_DELAY_MS * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  // Every attempt failed at the transport layer. Flag it so callers can tell a
  // pure connectivity failure apart from an application error.
  lastError.isNetworkError = true;
  throw lastError;
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
