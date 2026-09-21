import axios from 'axios';

let appToken = null; // { access_token, expires_at }
let tokenRequest = null; // in-flight token request, shared by concurrent callers

export const TRENDING_PLAYLIST_ID = '37i9dQZF1FwRJQfEovuoNH';

export async function getAppToken() {
  if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
    throw new Error('Spotify credentials not configured — set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local.');
  }
  if (appToken && appToken.expires_at > Date.now()) return appToken.access_token;

  // On a cold instance the homepage render, the playlist route and the
  // album-art route can all ask at once — share one token request.
  if (!tokenRequest) {
    tokenRequest = axios
      .post('https://accounts.spotify.com/api/token', new URLSearchParams({ grant_type: 'client_credentials' }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization:
            'Basic ' +
            Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64'),
        },
      })
      .then((resp) => {
        appToken = {
          access_token: resp.data.access_token,
          expires_at: Date.now() + (resp.data.expires_in - 60) * 1000,
        };
        return appToken.access_token;
      })
      .finally(() => {
        tokenRequest = null;
      });
  }
  return tokenRequest;
}

export function extractPlaylistId(input) {
  const match = String(input).match(/playlist[/:]([a-zA-Z0-9]+)/);
  return match ? match[1] : String(input).trim();
}
