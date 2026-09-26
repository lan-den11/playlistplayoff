import { Suspense } from 'react';
import { preconnect, preload } from 'react-dom';
import BracketApp from '../../components/bracket/BracketApp';

export const metadata = {
  title: 'Playlist Playoff — Bracket',
};

const SPOTIFY_EMBED_ORIGIN = 'https://open.spotify.com';

export default function BracketPage() {
  // Same head-start the homepage gives its trial embed: open the connection
  // and start downloading Spotify's iframe API before any client JS has
  // run, so the first real matchup's embed has less to wait on.
  preconnect(SPOTIFY_EMBED_ORIGIN);
  preload(`${SPOTIFY_EMBED_ORIGIN}/embed/iframe-api/v1`, { as: 'script' });

  return (
    <Suspense fallback={null}>
      <BracketApp />
    </Suspense>
  );
}
