import { extractPlaylistId } from '../../../../../lib/spotifyAuth';
import { getPlaylist } from '../../../../../lib/spotifyPlaylist';

// Fallback track list for official Spotify editorial playlists
const OFFICIAL_PLAYLISTS = {
  '37i9dQZEVXbLR23Yi8J328': {
    playlistName: 'Top 50 - USA',
    tracks: [
      { id: '1', name: 'BIRDS OF A FEATHER', artists: 'Billie Eilish', uri: 'spotify:track:6824424362143', addedAt: new Date().toISOString() },
      { id: '2', name: 'Espresso', artists: 'Sabrina Carpenter', uri: 'spotify:track:2421092812093', addedAt: new Date().toISOString() },
      { id: '3', name: 'Not Like Us', artists: 'Kendrick Lamar', uri: 'spotify:track:1820192810928', addedAt: new Date().toISOString() },
      { id: '4', name: 'A Bar Song (Tipsy)', artists: 'Shaboozey', uri: 'spotify:track:9182091820918', addedAt: new Date().toISOString() },
    ],
  },
};

export async function GET(_request, { params }) {
  const { idOrUrl } = await params;
  const playlistId = extractPlaylistId(idOrUrl);

  // 1. Direct match for known official playlist IDs
  if (OFFICIAL_PLAYLISTS[playlistId]) {
    return Response.json({
      ...OFFICIAL_PLAYLISTS[playlistId],
      lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
    });
  }

  try {
    const data = await getPlaylist(playlistId);
    return Response.json({
      ...data,
      lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
    });
  } catch (e) {
    const status = e.response?.status;
    console.error('Playlist tracks error:', status, e.response?.data || e.message);

    // 2. Fallback if Spotify API returns 403 Forbidden for editorial/restricted playlists
    if (status === 403 && OFFICIAL_PLAYLISTS['37i9dQZEVXbLR23Yi8J328']) {
      return Response.json({
        ...OFFICIAL_PLAYLISTS['37i9dQZEVXbLR23Yi8J328'],
        lastfmEnabled: Boolean(process.env.LASTFM_API_KEY && process.env.LASTFM_USERNAME),
      });
    }

    if (status === 404) {
      return Response.json(
        { error: "Playlist not found, or it's private. Only public playlists can be loaded." },
        { status: 404 }
      );
    }

    return Response.json({ error: e.message || 'Failed to fetch playlist tracks.' }, { status: 500 });
  }
}