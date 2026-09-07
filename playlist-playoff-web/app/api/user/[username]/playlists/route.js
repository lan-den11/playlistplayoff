import axios from 'axios';
import { getAppToken } from '../../../../../lib/spotifyAuth';

export async function GET(_request, { params }) {
  const { username } = await params;

  try {
    const token = await getAppToken();
    let items = [];
    let url = `https://api.spotify.com/v1/users/${encodeURIComponent(username)}/playlists?limit=50`;
    while (url) {
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
