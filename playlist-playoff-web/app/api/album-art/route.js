import axios from 'axios';
import { getAppToken } from '../../../lib/spotifyAuth';
import { limited } from '../../../lib/rateLimit';

const cache = (globalThis.__albumArtCache ??= new Map());
const MAX_ENTRIES = 500;
const MAX_FIELD_LENGTH = 200;
const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' };

export async function GET(request) {
  const blocked = limited(request, 'album-art', 30, 60_000);
  if (blocked) return blocked;

  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const album = searchParams.get('album');

  if (!artist || !album || artist.length > MAX_FIELD_LENGTH || album.length > MAX_FIELD_LENGTH) {
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
    while (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
    return Response.json({ image }, { headers: CACHE_HEADERS });
  } catch (e) {
    const status = e.response?.status;
    console.error('Album art lookup error:', status, e.response?.data || e.message);
    return Response.json({ image: null });
  }
}
