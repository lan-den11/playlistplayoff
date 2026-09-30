import { preconnect, preload } from 'react-dom';
import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Differentiator from '../components/home/Differentiator';
import MultiplayerTeaser from '../components/home/MultiplayerTeaser';
import Faq from '../components/home/Faq';
import Footer from '../components/home/Footer';
import PageBackground from '../components/ui/PageBackground';
import BackToTop from '../components/ui/BackToTop';
import { getTrendingPlaylistId, getAppAccessMode, getGenrePlaylists } from '../lib/posthog-server';
import { TRENDING_PLAYLIST_ID, getAppToken } from '../lib/spotifyAuth';
import { warmPlaylist } from '../lib/spotifyPlaylist';
import { syncHeroSnapshots } from '../lib/heroSnapshots';

export const dynamic = 'force-dynamic';

const SPOTIFY_EMBED_ORIGIN = 'https://open.spotify.com';
const SPOTIFY_IMAGE_CDN_ORIGIN = 'https://i.scdn.co';
const TRENDING_CACHE_TTL_MS = 10 * 60 * 1000;

const SHOW_NAVBAR = true;

export default async function HomePage() {
  preconnect(SPOTIFY_EMBED_ORIGIN);
  preconnect(SPOTIFY_IMAGE_CDN_ORIGIN);
  preload(`${SPOTIFY_EMBED_ORIGIN}/embed/iframe-api/v1`, { as: 'script' });
  getAppToken().catch(() => {});

  const [trendingPlaylistId, accessMode, genres] = await Promise.all([
    getTrendingPlaylistId(TRENDING_PLAYLIST_ID),
    getAppAccessMode(),
    getGenrePlaylists(),
  ]);

  syncHeroSnapshots([trendingPlaylistId, ...genres.map((genre) => genre.playlistId)]).catch(() => {});
  warmPlaylist(trendingPlaylistId, TRENDING_CACHE_TTL_MS);
  preload(`/api/playlist/${encodeURIComponent(trendingPlaylistId)}/tracks`, {
    as: 'fetch',
    crossOrigin: 'anonymous',
  });
  genres.forEach((genre) => warmPlaylist(genre.playlistId, TRENDING_CACHE_TTL_MS));

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-zinc-950">
      <PageBackground />
      {SHOW_NAVBAR && <Navbar accessMode={accessMode} />}
      <Hero trendingPlaylistId={trendingPlaylistId} genres={genres} accessMode={accessMode} showNavbar={SHOW_NAVBAR} />
      <HowItWorks />
      <Differentiator />
      <MultiplayerTeaser />
      <Faq />
      <Footer />
      <BackToTop />
    </main>
  );
}
