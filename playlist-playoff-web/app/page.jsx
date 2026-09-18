import Navbar from '../components/home/Navbar';
import Hero from '../components/home/Hero';
import HowItWorks from '../components/home/HowItWorks';
import Differentiator from '../components/home/Differentiator';
import MultiplayerTeaser from '../components/home/MultiplayerTeaser';
import Faq from '../components/home/Faq';
import Footer from '../components/home/Footer';
import PageBackground from '../components/ui/PageBackground';
import { getTrendingPlaylistId, getAppAccessMode } from '../lib/posthog-server';
import { TRENDING_PLAYLIST_ID } from '../lib/spotifyAuth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [trendingPlaylistId, accessMode] = await Promise.all([
    getTrendingPlaylistId(TRENDING_PLAYLIST_ID),
    getAppAccessMode(),
  ]);

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-zinc-950">
      <PageBackground />
      <Navbar accessMode={accessMode} />
      <Hero trendingPlaylistId={trendingPlaylistId} accessMode={accessMode} />
      <HowItWorks />
      <Differentiator />
      <MultiplayerTeaser />
      <Faq />
      <Footer />
    </main>
  );
}
