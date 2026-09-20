import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Waitlist } from '@clerk/nextjs';
import Footer from '../../components/home/Footer';
import SiteHeader from '../../components/ui/SiteHeader';
import { getAppAccessMode } from '../../lib/posthog-server';
import PageBackground from '../components/ui/PageBackground';

export const metadata = {
  title: 'Playlist Playoff — Join the Waitlist',
  description: "Register your interest — we'll let you know the moment Playlist Playoff opens up.",
};

export default async function WaitlistPage() {
  const [{ userId }, mode] = await Promise.all([auth(), getAppAccessMode()]);

  if (mode === 'unlocked') redirect('/');

  if (userId && mode !== 'waitlist-only') redirect('/');

  // hero-only (and unlocked, which redirects above) → the logo goes back to
  // the hero. waitlist-only has no hero to return to: proxy.js redirects "/"
  // straight back here, so link to this page instead of bouncing through it.
  const logoHref = mode === 'waitlist-only' ? '/waitlist' : '/';

  return (
    <main className="min-h-screen overflow-x-clip bg-zinc-950">
      <SiteHeader logoHref={logoHref} />

      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center md:px-8">
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Join the waitlist
        </h1>
        <p className="mb-8 max-w-sm text-sm text-zinc-400">
          We're onboarding in waves- enter your email and we'll let you know the second a spot opens up.
        </p>
        {/* Clerk's card has a fixed rem width; capping it at 100% of this column keeps it from pushing past narrow screens. */}
        <div className="flex w-full justify-center [&_.cl-cardBox]:max-w-full [&_.cl-rootBox]:min-w-0 [&_.cl-rootBox]:max-w-full">
          <Waitlist />
	<PageBackground />
        </div>
      </div>

      <Footer />
    </main>
  );
}
