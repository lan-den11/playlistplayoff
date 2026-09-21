import { preconnect, preload } from 'react-dom';
import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Differentiator from '../components/home/Differentiator';
import MultiplayerTeaser from '../components/home/MultiplayerTeaser';
import Faq from '../components/home/Faq';
import Footer from '../components/home/Footer';
import PageBackground from '../components/ui/PageBackground';
import { getTrendingPlaylistId, getAppAccessMode } from '../lib/posthog-server';
import { TRENDING_PLAYLIST_ID, getAppToken } from '../lib/spotifyAuth';
import { warmPlaylist } from '../lib/spotifyPlaylist';

export const dynamic = 'force-dynamic';

const SPOTIFY_EMBED_ORIGIN = 'https://open.spotify.com';
const TRENDING_CACHE_TTL_MS = 10 * 60 * 1000;

// The homepage topbar is off for now — set to true to bring it back. Hero
// reads the same flag, so it gives the header's height back to the hero
// (and takes it again) automatically; nothing else needs touching.
const SHOW_NAVBAR = false;

export default async function HomePage() {
  // Hero matchup critical path, started as early as possible: open the
  // connection to Spotify's embed host, begin downloading its iframe API, and
  // grab a Spotify token while the PostHog flags below are still resolving.
  preconnect(SPOTIFY_EMBED_ORIGIN);
  preload(`${SPOTIFY_EMBED_ORIGIN}/embed/iframe-api/v1`, { as: 'script' });
  getAppToken().catch(() => {});

  const [trendingPlaylistId, accessMode] = await Promise.all([
    getTrendingPlaylistId(TRENDING_PLAYLIST_ID),
    getAppAccessMode(),
  ]);

  // Fetch the playlist server-side now, and tell the browser to request the
  // same URL the hero will use during HTML parse — before any JS has loaded.
  warmPlaylist(trendingPlaylistId, TRENDING_CACHE_TTL_MS);
  preload(`/api/playlist/${encodeURIComponent(trendingPlaylistId)}/tracks`, {
    as: 'fetch',
    crossOrigin: 'anonymous',
  });

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-zinc-950">
      <PageBackground />
      {SHOW_NAVBAR && <Navbar accessMode={accessMode} />}
      <Hero trendingPlaylistId={trendingPlaylistId} accessMode={accessMode} showNavbar={SHOW_NAVBAR} />
      <HowItWorks />
      <Differentiator />
      <MultiplayerTeaser />
      <Faq />
      <Footer />
    </main>
  );
}
