import { extractPlaylistId, isValidPlaylistId } from '../../../../../lib/spotifyAuth';
import { getPlaylist } from '../../../../../lib/spotifyPlaylist';
import { limited } from '../../../../../lib/rateLimit';

export async function GET(request, { params }) {
  const blocked = limited(request, 'playlist', 30, 60_000);
  if (blocked) return blocked;

  const { idOrUrl } = await params;
  const playlistId = extractPlaylistId(idOrUrl);

  if (!isValidPlaylistId(playlistId)) {
    return Response.json({ error: "That doesn't look like a valid Spotify playlist link or ID." }, { status: 400 });
  }

  try {
    const data = await getPlaylist(playlistId);
    return Response.json(
      {
        ...data,
        lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        },
      }
    );
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
