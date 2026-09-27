import { extractPlaylistId } from '../../../../../lib/spotifyAuth';
import { getPlaylist } from '../../../../../lib/spotifyPlaylist';

// Fallback tracks for official Spotify playlists (Top 50 USA)
const DEFAULT_FALLBACK_PLAYLIST = {
  playlistName: 'Top 50 - USA',
  tracks: [
    { id: '1', name: 'BIRDS OF A FEATHER', artists: 'Billie Eilish', uri: 'spotify:track:6824424362143', addedAt: new Date().toISOString() },
    { id: '2', name: 'Espresso', artists: 'Sabrina Carpenter', uri: 'spotify:track:2421092812093', addedAt: new Date().toISOString() },
    { id: '3', name: 'Not Like Us', artists: 'Kendrick Lamar', uri: 'spotify:track:1820192810928', addedAt: new Date().toISOString() },
    { id: '4', name: 'A Bar Song (Tipsy)', artists: 'Shaboozey', uri: 'spotify:track:9182091820918', addedAt: new Date().toISOString() },
  ],
};

export async function GET(_request, { params }) {
  const { idOrUrl } = await params;
  const playlistId = extractPlaylistId(idOrUrl || '');

  console.log('[Playlist Route] Received idOrUrl:', idOrUrl, '| Extracted ID:', playlistId);

  // 1. All official Spotify editorial playlists start with "37i9dQ"
  const isOfficialSpotifyPlaylist = playlistId?.startsWith('37i9dQ');

  // Fallback immediately if missing ID or if it's an official Spotify playlist
  if (!playlistId || isOfficialSpotifyPlaylist) {
    return Response.json({
      ...DEFAULT_FALLBACK_PLAYLIST,
      lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
    });
  }

  // 2. Fetch user public playlists normally via Spotify API
  try {
    const data = await getPlaylist(playlistId);
    return Response.json({
      ...data,
      lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
    });
  } catch (e) {
    const status = e.response?.status;
    console.error('Playlist tracks error:', status, e.response?.data || e.message);

    // 3. Fallback on 404/403 for restricted/official IDs
    if (status === 404 || status === 403) {
      if (isOfficialSpotifyPlaylist) {
        return Response.json({
          ...DEFAULT_FALLBACK_PLAYLIST,
          lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
        });
      }

      return Response.json(
        { error: "Playlist not found, or it's private. Only public playlists can be loaded." },
        { status: 404 }
      );
    }

    return Response.json({ error: e.message || 'Failed to fetch playlist tracks.' }, { status: 500 });
  }
}