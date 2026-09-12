import axios from 'axios';

let appToken = null; // { access_token, expires_at }

export const TRENDING_PLAYLIST_ID = '37i9dQZF1FwRJQfEovuoNH';

export async function getAppToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
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
    expires_at: Date.now() + (resp.data.expires_in - 60) * 1000,
  };
  return appToken.access_token;
}

export function extractPlaylistId(input) {
  const match = String(input).match(/playlist[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : String(input).trim();
}
