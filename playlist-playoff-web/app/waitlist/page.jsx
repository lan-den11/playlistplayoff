import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import Footer from '../../components/home/Footer';
import SiteHeader from '../../components/ui/SiteHeader';
import PageBackground from '../../components/ui/PageBackground';
import WaitlistForm from '../../components/home/WaitlistForm';
import { getAppAccessMode } from '../../lib/posthog-server';

export const metadata = {
  title: 'Playlist Playoff — Join the Waitlist',
  description: "Register your interest — we'll let you know the moment Playlist Playoff opens up.",
};

export default async function WaitlistPage({ searchParams }) {
  const [{ userId }, mode, params] = await Promise.all([auth(), getAppAccessMode(), searchParams]);

  if (mode === 'unlocked') redirect('/');

  if (userId && mode !== 'waitlist-only') redirect('/');

  // hero-only (and unlocked, which redirects above) → the logo goes back to
  // the hero. waitlist-only has no hero to return to: proxy.js redirects "/"
  // straight back here, so link to this page instead of bouncing through it.
  const logoHref = mode === 'waitlist-only' ? '/waitlist' : '/';

  // Same `?ref=CODE` handoff the homepage uses (see app/page.jsx) — this
  // page is a real join point too (arrived at directly, or bounced here by
  // proxy.js), so a referral link landing here must still credit its owner.
  const rawRef = params?.ref;
  const referredBy = (Array.isArray(rawRef) ? rawRef[0] : rawRef)?.trim().slice(0, 32) || null;

  return (
    <main className="relative isolate min-h-screen overflow-x-clip bg-zinc-950">
      <PageBackground />
      <SiteHeader logoHref={logoHref} />

      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center md:px-8">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-5 py-2.5 text-sm font-bold text-amber-300 md:text-base">
          <Sparkles className="h-4 w-4 flex-none md:h-5 md:w-5" />
          1 week of Premium free + a Founding Member badge
        </div>
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Join the waitlist
        </h1>
        <p className="mb-8 max-w-sm text-sm text-zinc-400">
          We're onboarding in waves — enter your email and we'll let you know the second a spot opens up, plus give
          you a link to move up the list.
        </p>

        {/* Our own form (not Clerk's prebuilt <Waitlist /> widget): joining
            here now registers a referral code and tracks the email the same
            way every other waitlist entry point on the site does, and shows
            the referral link + leaderboard right after signup instead of a
            dead end. */}
        <WaitlistForm source="waitlist_page" gradient="gold" label="Join the waitlist" referredBy={referredBy} />
      </div>

      <Footer />
    </main>
  );
}
