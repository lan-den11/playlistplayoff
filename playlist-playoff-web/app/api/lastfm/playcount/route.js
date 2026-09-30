import { getLastfmPlaycount, getLastfmTags, queueLastfm } from '../../../../lib/lastfm';
import { limited } from '../../../../lib/rateLimit';

const USERNAME_RE = /^[A-Za-z][A-Za-z0-9_-]{1,14}$/;
const MAX_FIELD_LENGTH = 200;

export async function GET(request) {
  const blocked = limited(request, 'lastfm', 120, 60_000);
  if (blocked) return blocked;

  if (!process.env.LASTFM_API_KEY) {
    return Response.json({ enabled: false, playcount: null, tags: [] });
  }

  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  const track = searchParams.get('track');
  const username = (searchParams.get('username') || process.env.LASTFM_USERNAME || '').trim();

  if (!artist || !track || artist.length > MAX_FIELD_LENGTH || track.length > MAX_FIELD_LENGTH) {
    return Response.json({ error: 'artist and track query params are required' }, { status: 400 });
  }
  if (!username) {
    return Response.json({ enabled: false, playcount: null, tags: [] });
  }
  if (!USERNAME_RE.test(username)) {
    return Response.json({ error: 'Enter a valid Last.fm username.' }, { status: 400 });
  }

  try {
    const [playcount, tags] = await Promise.all([
      queueLastfm(() => getLastfmPlaycount(artist, track, username)),
      queueLastfm(() => getLastfmTags(artist, track)),
    ]);
    return Response.json({ enabled: true, playcount, tags });
  } catch (e) {
    if (e.busy) {
      return Response.json(
        { error: 'Last.fm lookups are busy. Try again in a moment.' },
        { status: 429, headers: { 'Retry-After': '5' } }
      );
    }
    throw e;
  }
}
