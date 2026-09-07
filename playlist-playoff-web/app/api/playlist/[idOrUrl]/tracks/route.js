import axios from 'axios';
import { getAppToken, extractPlaylistId } from '../../../../../lib/spotifyAuth';

export async function GET(_request, { params }) {
  const { idOrUrl } = await params;
  const playlistId = extractPlaylistId(idOrUrl);

  try {
    // This line crashed the old Express server when it lived outside the
    // try block (an uncaught rejection here took down the whole process).
    // Keeping it in here is the actual fix, not just a rewrite.
    const token = await getAppToken();

    let items = [];
    let url = `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=next,items(added_at,track(id,uri,name,duration_ms,popularity,artists(name),album(name,release_date,images)))`;
    while (url) {
      const resp = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      items = items.concat(resp.data.items);
      url = resp.data.next;
    }

    const tracks = items
      .map((i) => (i.track ? { ...i.track, addedAt: i.added_at } : null))
      .filter((t) => t && t.id)
      .map((t) => ({
        id: t.id,
        uri: t.uri,
        name: t.name,
        artists: t.artists.map((a) => a.name).join(', '),
        image: t.album?.images?.[t.album.images.length - 1]?.url || t.album?.images?.[0]?.url || null,
        popularity: t.popularity,
        addedAt: t.addedAt,
        albumName: t.album?.name || null,
        releaseYear: t.album?.release_date ? t.album.release_date.slice(0, 4) : null,
      }));

    return Response.json({
      tracks,
      lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
    });
  } catch (e) {
    const status = e.response?.status;
    console.error('Playlist tracks error:', status, e.response?.data || e.message);
    if (status === 404) {
      return Response.json(
        { error: "Playlist not found, or it's private. Only public playlists can be loaded." },
        { status: 404 }
      );
    }
    if (!status) {
      // Not a Spotify API error (no e.response) — most likely a local config
      // problem like missing credentials. Surface the real message instead
      // of a generic one so it's actually debuggable from the browser.
      return Response.json({ error: e.message }, { status: 500 });
    }
    return Response.json({ error: 'Failed to fetch playlist tracks.' }, { status: 500 });
  }
}
