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
// PostHog flag afterward would do nothing until the next deploy.
//
// Deliberately force-dynamic rather than `revalidate: N`: the PostHog fetch
// itself now sets `cache: 'no-store'` (see lib/posthog-server.js), which
// already forces this route dynamic under the hood — declaring it explicitly
// here just makes that intentional instead of implicit, and avoids stacking
// a second, redundant ISR caching signal on top of our own in-memory TTL.
// Staleness is bounded by PLAYLIST_CACHE_MS (60s) in lib/posthog-server.js,
// not by anything Next.js caches at the route level.
export const dynamic = 'force-dynamic';

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
