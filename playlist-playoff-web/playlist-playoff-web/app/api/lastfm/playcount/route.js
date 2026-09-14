import { getLastfmPlaycount, getLastfmTags, queueLastfm } from '../../../../lib/lastfm';

export async function GET(request) {
  if (!process.env.LASTFM_API_KEY) {
    return Response.json({ enabled: false, playcount: null, tags: [] });
  }

  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const track = searchParams.get('track');
  const username = (searchParams.get('username') || process.env.LASTFM_USERNAME || '').trim();

  if (!artist || !track) {
    return Response.json({ error: 'artist and track query params are required' }, { status: 400 });
  }
  if (!username) {
    return Response.json({ enabled: false, playcount: null, tags: [] });
  }

  const [playcount, tags] = await Promise.all([
    queueLastfm(() => getLastfmPlaycount(artist, track, username)),
    queueLastfm(() => getLastfmTags(artist, track)),
  ]);

  return Response.json({ enabled: true, playcount, tags });
}
