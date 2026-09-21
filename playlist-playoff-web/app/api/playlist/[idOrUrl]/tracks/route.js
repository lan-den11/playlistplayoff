import { extractPlaylistId } from '../../../../../lib/spotifyAuth';
import { getPlaylist } from '../../../../../lib/spotifyPlaylist';

export async function GET(_request, { params }) {
  const { idOrUrl } = await params;
  const playlistId = extractPlaylistId(idOrUrl);

  try {
    const data = await getPlaylist(playlistId);
    return Response.json({
      ...data,
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
      return Response.json({ error: e.message }, { status: 500 });
    }
    return Response.json({ error: 'Failed to fetch playlist tracks.' }, { status: 500 });
  }
}
