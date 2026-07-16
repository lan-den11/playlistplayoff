require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8888;
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const CLERK_PUBLISHABLE_KEY = process.env.CLERK_PUBLISHABLE_KEY;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const DATABASE_URL = process.env.DATABASE_URL;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('\nMissing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.');
  console.error('Copy .env.example to .env and fill them in. See README.md.\n');
  process.exit(1);
}

const accountsEnabled = !!(CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY && DATABASE_URL);
if (!accountsEnabled) {
  console.log('\nSign-in / saved profiles disabled — CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, and');
  console.log('DATABASE_URL are not all set in .env. Everything else still works normally.\n');
}

let pool = null;
let ensureTablePromise = null;
if (DATABASE_URL) {
  pool = new Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });
  ensureTablePromise = pool.query(`
    CREATE TABLE IF NOT EXISTS user_profiles (
      clerk_user_id TEXT PRIMARY KEY,
      spotify_username TEXT,
      lastfm_username TEXT,
      updated_at TIMESTAMPTZ DEFAULT now()
    )
  `).catch((e) => console.error('Failed to ensure user_profiles table exists:', e.message));
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

let clerkMiddleware = (req, res, next) => next();
let requireAuth = (req, res, next) => res.status(503).json({ error: 'Sign-in is not configured on this server.' });
let getAuthUserId = () => null;
if (CLERK_PUBLISHABLE_KEY && CLERK_SECRET_KEY) {
  const clerkExpress = require('@clerk/express');
  clerkMiddleware = clerkExpress.clerkMiddleware();
  requireAuth = clerkExpress.requireAuth();
  getAuthUserId = (req) => clerkExpress.getAuth(req)?.userId || null;
}
app.use(clerkMiddleware);

// Pinging this (not just the homepage) is what actually prevents Supabase's
// free-tier pause — Supabase only resets its 7-day inactivity timer on real
// database queries, not on any HTTP request to your app. A plain homepage
// ping (which is enough to keep Render itself awake) does nothing for this.
app.all('/api/health', async (req, res) => {
  if (!pool) return res.json({ ok: true, database: 'not configured' });
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (e) {
    res.status(500).json({ ok: false, database: 'error' });
  }
});

app.get('/api/clerk-config', (req, res) => {
  res.json({ enabled: !!CLERK_PUBLISHABLE_KEY, publishableKey: CLERK_PUBLISHABLE_KEY || null });
});

app.get('/api/profile', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured.' });
  const userId = getAuthUserId(req);
  try {
    await ensureTablePromise;
    const result = await pool.query('SELECT spotify_username, lastfm_username FROM user_profiles WHERE clerk_user_id = $1', [userId]);
    if (!result.rows.length) return res.json({ spotifyUsername: null, lastfmUsername: null });
    res.json({ spotifyUsername: result.rows[0].spotify_username, lastfmUsername: result.rows[0].lastfm_username });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

app.post('/api/profile', requireAuth, async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured.' });
  const userId = getAuthUserId(req);
  const { spotifyUsername, lastfmUsername } = req.body || {};
  try {
    await ensureTablePromise;
    await pool.query(
      `INSERT INTO user_profiles (clerk_user_id, spotify_username, lastfm_username, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (clerk_user_id)
       DO UPDATE SET spotify_username = $2, lastfm_username = $3, updated_at = now()`,
      [userId, spotifyUsername || null, lastfmUsername || null]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: 'Failed to save profile.' });
  }
});

// No user login anywhere in this app — every playlist lookup (by link or by
// username) goes through Client Credentials (an app-only token), which doesn't
// require anyone to authenticate. Only public playlists are reachable this way,
// but it means there's no per-user cap of any kind.
let appToken = null; // { access_token, expires_at }

async function getAppToken() {
  if (appToken && appToken.expires_at > Date.now()) return appToken.access_token;
  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      },
    }
  );
  appToken = {
    access_token: resp.data.access_token,
    expires_at: Date.now() + (resp.data.expires_in - 60) * 1000,
  };
  return appToken.access_token;
}

// Look up any Spotify user's PUBLIC playlists by their username/user ID — this
// uses an app-only token (Client Credentials), not per-user OAuth, so it doesn't
// require that person to log in and doesn't count against the 5-authenticated-
// user Development Mode cap. Only playlists that user has made public on their
// profile are returned — a private playlist still needs its owner to log in.
app.get('/api/user/:username/playlists', async (req, res) => {
  const { username } = req.params;
  try {
    const token = await getAppToken();
    let items = [];
    let url = `https://api.spotify.com/v1/users/${encodeURIComponent(username)}/playlists?limit=50`;
    while (url) {
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      items = items.concat(resp.data.items);
      url = resp.data.next;
    }
    res.json(items.map((p) => ({ id: p.id, name: p.name, tracks: p.tracks.total, image: p.images?.[0]?.url })));
  } catch (e) {
    const status = e.response?.status;
    console.error(status, e.response?.data || e.message);
    if (status === 404) return res.status(404).json({ error: 'No Spotify user found with that username.' });
    res.status(500).json({ error: 'Failed to fetch that user\'s playlists.' });
  }
});

// ---- Fetch every track in a playlist (public or private) ----
function extractPlaylistId(input) {
  const match = input.match(/playlist\/([a-zA-Z0-9]+)/);
  if (match) return match[1];
  return input.trim();
}

// ---- Last.fm personal play counts ----
const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const lastfmCache = new Map(); // key: "artist||track" -> playcount (number) or null

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLastfmPlaycount(artist, track, username) {
  const key = `pc||${username.toLowerCase()}||${artist.toLowerCase()}||${track.toLowerCase()}`;
  if (lastfmCache.has(key)) return lastfmCache.get(key);
  try {
    const resp = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getInfo',
        artist,
        track,
        username,
        api_key: LASTFM_API_KEY,
        format: 'json',
        autocorrect: 1,
      },
      timeout: 8000,
    });
    const count = resp.data?.track?.userplaycount;
    const value = count !== undefined ? parseInt(count, 10) : null;
    lastfmCache.set(key, value);
    return value;
  } catch (e) {
    lastfmCache.set(key, null);
    return null;
  }
}

async function getLastfmTags(artist, track) {
  const key = `tags||${artist.toLowerCase()}||${track.toLowerCase()}`;
  if (lastfmCache.has(key)) return lastfmCache.get(key);
  try {
    const resp = await axios.get('https://ws.audioscrobbler.com/2.0/', {
      params: {
        method: 'track.getTopTags',
        artist,
        track,
        api_key: LASTFM_API_KEY,
        format: 'json',
        autocorrect: 1,
      },
      timeout: 8000,
    });
    const rawTags = resp.data?.toptags?.tag;
    const list = Array.isArray(rawTags) ? rawTags : rawTags ? [rawTags] : [];
    const value = list.slice(0, 3).map((t) => t.name);
    lastfmCache.set(key, value);
    return value;
  } catch (e) {
    lastfmCache.set(key, []);
    return [];
  }
}

async function attachLastfmPlaycounts(tracks) {
  // no longer used to bulk-fetch on load; kept as reference for the queued single-track flow below
  return tracks;
}

// Serializes all Last.fm lookups through one queue so we never exceed the 5 req/sec
// limit, regardless of how many concurrent requests the client fires or how many
// different methods (playcount, tags) are being requested.
const lastfmRequestTimestamps = [];
const LASTFM_MAX_PER_WINDOW = 5;
const LASTFM_WINDOW_MS = 1000;

async function acquireLastfmSlot() {
  while (true) {
    const now = Date.now();
    while (lastfmRequestTimestamps.length && now - lastfmRequestTimestamps[0] > LASTFM_WINDOW_MS) {
      lastfmRequestTimestamps.shift();
    }
    if (lastfmRequestTimestamps.length < LASTFM_MAX_PER_WINDOW) {
      lastfmRequestTimestamps.push(now);
      return;
    }
    const waitTime = LASTFM_WINDOW_MS - (now - lastfmRequestTimestamps[0]) + 5;
    await sleep(waitTime);
  }
}

// Previously this serialized every single request one-at-a-time with a flat
// 220ms gap after each — safe, but much slower than necessary. Last.fm's actual
// limit is up to 5 requests per rolling second, so independent requests (e.g.
// the playcount + tags lookups for the same track) can now fire concurrently
// as long as they stay within that real budget.
function queueLastfmTask(taskFn) {
  return acquireLastfmSlot().then(() => taskFn());
}



app.get('/api/playlist/:idOrUrl/tracks', async (req, res) => {
  const playlistId = extractPlaylistId(req.params.idOrUrl);
  const token = await getAppToken();

  try {
    let items = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,items(added_at,track(id,uri,name,duration_ms,popularity,artists(name),album(name,release_date,images)))`;
    while (url) {
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      items = items.concat(resp.data.items);
      url = resp.data.next;
    }
    let tracks = items
      .map((i) => ({ ...i.track, addedAt: i.added_at }))
      .filter((t) => t && t.id)
      .map((t) => ({
        id: t.id,
        uri: t.uri,
        name: t.name,
        artists: t.artists.map((a) => a.name).join(', '),
        image: t.album?.images?.[t.album.images.length - 1]?.url || t.album?.images?.[0]?.url,
        popularity: t.popularity,
        addedAt: t.addedAt,
        albumName: t.album?.name || null,
        releaseYear: t.album?.release_date ? t.album.release_date.slice(0, 4) : null,
      }));

    tracks = await attachLastfmPlaycounts(tracks);
    res.json({ tracks, lastfmEnabled: !!(LASTFM_API_KEY && LASTFM_USERNAME) });
  } catch (e) {
    const status = e.response?.status;
    console.error(status, e.response?.data || e.message);
    if (status === 404) {
      return res.status(404).json({ error: 'Playlist not found, or it\'s private. Only public playlists can be loaded.' });
    }
    res.status(500).json({ error: 'Failed to fetch playlist tracks' });
  }
});

app.get('/api/lastfm/playcount', async (req, res) => {
  if (!LASTFM_API_KEY) {
    return res.json({ enabled: false, playcount: null, tags: [] });
  }
  const { artist, track } = req.query;
  const username = (req.query.username || LASTFM_USERNAME || '').trim();
  if (!artist || !track) return res.status(400).json({ error: 'artist and track query params required' });
  if (!username) return res.json({ enabled: false, playcount: null, tags: [] });
  const [playcount, tags] = await Promise.all([
    queueLastfmTask(() => getLastfmPlaycount(artist, track, username)),
    queueLastfmTask(() => getLastfmTags(artist, track)),
  ]);
  res.json({ enabled: true, playcount, tags });
});

app.listen(PORT, () => {
  console.log(`\nSpotify Bracket running at http://127.0.0.1:${PORT}\n`);
});
