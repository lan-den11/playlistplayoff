import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Differentiator from '../components/home/Differentiator';
import MultiplayerTeaser from '../components/home/MultiplayerTeaser';
import Faq from '../components/home/Faq';
import Footer from '../components/home/Footer';
import { getTrendingPlaylistId } from '../lib/posthog-server';
import { TRENDING_PLAYLIST_ID } from '../lib/spotifyAuth';

// Without this, Next statically prerenders "/" once at build/deploy time —
// getTrendingPlaylistId() would run exactly once, forever, and toggling the
// PostHog flag afterward would do nothing until the next deploy. Revalidate
// on a 60s cadence (matching PLAYLIST_CACHE_MS in lib/posthog-server.js) so
// the homepage picks up a flag change within about a minute, no redeploy
// needed, while still serving cached HTML the rest of the time.
export const revalidate = 60;

export default async function HomePage() {
  // Resolved server-side so there's no client-side flicker/refetch — see
  // lib/posthog-server.js for the "homepage-trending-playlist" flag this
  // reads, and lib/spotifyAuth.js for the hardcoded fallback it falls back
  // to when that flag is off/unset.
  const trendingPlaylistId = await getTrendingPlaylistId(TRENDING_PLAYLIST_ID);

  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
      <Hero trendingPlaylistId={trendingPlaylistId} />
      <HowItWorks />
      <Differentiator />
      <MultiplayerTeaser />
      <Faq />
      <Footer />
    </main>
  );
}
