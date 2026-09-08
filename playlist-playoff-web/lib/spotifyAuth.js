import axios from 'axios';

let appToken = null; // { access_token, expires_at }

// Spotify's own editorially-curated "Top 50 - Global" playlist. Used as a
// stable, no-extra-auth-scopes source of "what's trending right now" for
// the homepage teaser bracket (see components/home/HeroMatchup.jsx) —
// loaded through the exact same /api/playlist/[idOrUrl]/tracks route as any
// playlist a person pastes in themselves.
export const TRENDING_PLAYLIST_ID = '37i9dQZEVXbMDoHDwVN2tF';

export async function getAppToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    // Thrown (not silently returned) so the calling route's catch block can
    // surface a clear message instead of a generic "Spotify API failed".
    throw new Error('Spotify credentials not configured — set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.');
  }
  if (appToken && appToken.expires_at > Date.now()) return appToken.access_token;

  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
    }
  );

  appToken = {
    access_token: resp.data.access_token,
    expires_at: Date.now() + (resp.data.expires_in - 60) * 1000, // refresh a minute early
  };
  return appToken.access_token;
}

// Accepts a bare ID, a full open.spotify.com URL, or a spotify: URI.
export function extractPlaylistId(input) {
  const match = String(input).match(/playlist[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : String(input).trim();
}
