import { preconnect, preload } from 'react-dom';
import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Differentiator from '../components/home/Differentiator';
import MultiplayerTeaser from '../components/home/MultiplayerTeaser';
import Faq from '../components/home/Faq';
import Footer from '../components/home/Footer';
import PageBackground from '../components/ui/PageBackground';
import { getTrendingPlaylistId, getAppAccessMode, getGenrePlaylists } from '../lib/posthog-server';
import { TRENDING_PLAYLIST_ID, getAppToken } from '../lib/spotifyAuth';
import { warmPlaylist } from '../lib/spotifyPlaylist';

export const dynamic = 'force-dynamic';

const SPOTIFY_EMBED_ORIGIN = 'https://open.spotify.com';
const TRENDING_CACHE_TTL_MS = 10 * 60 * 1000;

// Homepage topbar toggle — set to false to hide it. Hero reads the same
// flag, so it gives the header's height to the hero (and takes it back)
// automatically; nothing else needs touching.
const SHOW_NAVBAR = true;

export default async function HomePage({ searchParams }) {
  // Hero matchup critical path, started as early as possible: open the
  // connection to Spotify's embed host, begin downloading its iframe API, and
  // grab a Spotify token while the PostHog flags below are still resolving.
  preconnect(SPOTIFY_EMBED_ORIGIN);
  preload(`${SPOTIFY_EMBED_ORIGIN}/embed/iframe-api/v1`, { as: 'script' });
  getAppToken().catch(() => {});

  const [trendingPlaylistId, accessMode, genres, params] = await Promise.all([
    getTrendingPlaylistId(TRENDING_PLAYLIST_ID),
    getAppAccessMode(),
    getGenrePlaylists(),
    searchParams,
  ]);

  // Whoever's link this visitor arrived through — threaded down to every
  // WaitlistForm instance so a signup can credit the right referral code.
  // See hooks/useReferralCode.js and lib/db.js `referral_codes`.
  const rawRef = params?.ref;
  const referredBy = (Array.isArray(rawRef) ? rawRef[0] : rawRef)?.trim().slice(0, 32) || null;

  // Fetch the trending playlist server-side now, and tell the browser to
  // request the same URL the hero will use during HTML parse — before any JS
  // has loaded. Genre tabs warm the same way, but stay lazy (no preload hint)
  // since only one of them is ever shown first.
  warmPlaylist(trendingPlaylistId, TRENDING_CACHE_TTL_MS);
  preload(`/api/playlist/${encodeURIComponent(trendingPlaylistId)}/tracks`, {
    as: 'fetch',
    crossOrigin: 'anonymous',
  });
  genres.forEach((genre) => warmPlaylist(genre.playlistId, TRENDING_CACHE_TTL_MS));

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-zinc-950 [data-theme=light]:bg-zinc-50">
      <PageBackground />
      {SHOW_NAVBAR && <Navbar accessMode={accessMode} />}
      <Hero
        trendingPlaylistId={trendingPlaylistId}
        genres={genres}
        accessMode={accessMode}
        showNavbar={SHOW_NAVBAR}
        referredBy={referredBy}
      />
      <HowItWorks />
      <Differentiator />
      <MultiplayerTeaser referredBy={referredBy} />
      <Faq />
      <Footer />
    </main>
  );
}
