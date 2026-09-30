import axios from 'axios';
import { getAppToken } from '../../../../../lib/spotifyAuth';
import { limited } from '../../../../../lib/rateLimit';

const USERNAME_RE = /^[A-Za-z0-9._:-]{1,64}$/;
const MAX_PAGES = 10;

export async function GET(request, { params }) {
  const blocked = limited(request, 'user-playlists', 20, 60_000);
  if (blocked) return blocked;

  const { username } = await params;
  if (!USERNAME_RE.test(username)) {
    return Response.json({ error: 'Enter a valid Spotify username.' }, { status: 400 });
  }

  try {
    const token = await getAppToken();
    let items = [];
    let url = `https://api.spotify.com/v1/users/${encodeURIComponent(username)}/playlists?limit=50`;
    for (let page = 0; url && page < MAX_PAGES; page++) {
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      items = items.concat(resp.data.items);
      url = resp.data.next;
    }
    return Response.json(
      items
        .filter(Boolean)
        .map((p) => ({ id: p.id, name: p.name, tracks: p.tracks.total, image: p.images?.[0]?.url || null }))
    );
  } catch (e) {
    const status = e.response?.status;
    console.error('User playlists error:', status, e.response?.data || e.message);
    if (status === 404) return Response.json({ error: 'No Spotify user found with that username.' }, { status: 404 });
    if (!status) return Response.json({ error: e.message }, { status: 500 });
    return Response.json({ error: "Failed to fetch that user's playlists." }, { status: 500 });
  }
}
