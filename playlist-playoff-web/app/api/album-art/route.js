import axios from 'axios';
import { getAppToken } from '../../../lib/spotifyAuth';

// Looks up one album's cover art by artist + album name, using the same
// client-credentials token every other Spotify route already uses. This
// exists for marketing/mockup UI (e.g. the homepage's Differentiator
// section) that wants a real, current cover image instead of a hardcoded
// CDN URL that could rot or never gets verified in the first place.
//
// Cover art for a given album basically never changes, so successful
// lookups are cached twice: in-process (no repeat Spotify calls per warm
// instance) and at the CDN via Cache-Control (one call per day globally,
// however many visitors a launch brings). Failures are never cached.
const cache = new Map();
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const album = searchParams.get('album');

  if (!artist || !album) {
    return Response.json({ error: 'artist and album query params are required' }, { status: 400 });
  }

  const key = `${artist}||${album}`.toLowerCase();
  if (cache.has(key)) return Response.json({ image: cache.get(key) }, { headers: CACHE_HEADERS });

  try {
    const token = await getAppToken();
    const resp = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: `album:${album} artist:${artist}`, type: 'album', limit: 1 },
    });
    const image = resp.data.albums?.items?.[0]?.images?.[0]?.url || null;
    if (!image) return Response.json({ image: null });
    cache.set(key, image);
    return Response.json({ image }, { headers: CACHE_HEADERS });
  } catch (e) {
    const status = e.response?.status;
    console.error('Album art lookup error:', status, e.response?.data || e.message);
    return Response.json({ image: null });
  }
}
