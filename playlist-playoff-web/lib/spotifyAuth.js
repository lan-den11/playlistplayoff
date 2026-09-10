import axios from 'axios';

let appToken = null; // { access_token, expires_at }

// Spotify's own editorially-curated "Top 50 - USA" playlist. Used as a
// stable, no-extra-auth-scopes source of "what's trending right now in the
// US" for the homepage teaser bracket (see components/home/HeroMatchup.jsx).
//
// VERIFIED (this round): confirmed live against Spotify — this ID resolves
// to the real, currently-updating "Top 50 - USA" editorial playlist. If the
// Hero teaser is still falling back to the static, non-interactive preview
// card, the ID is NOT the problem — see the note in HeroMatchup.jsx and
// README_CHANGES.txt about SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET.
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
