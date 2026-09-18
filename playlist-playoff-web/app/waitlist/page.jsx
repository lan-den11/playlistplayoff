import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Headphones } from 'lucide-react';
import { Waitlist } from '@clerk/nextjs';
import Footer from '../../components/home/Footer';
import GlassIconBadge from '../../components/ui/GlassIconBadge';
import { getAppAccessMode } from '../../lib/posthog-server';

export const metadata = {
  title: 'Playlist Playoff — Join the Waitlist',
  description: "Register your interest — we'll let you know the moment Playlist Playoff opens up.",
};

export default async function WaitlistPage() {
  const [{ userId }, mode] = await Promise.all([auth(), getAppAccessMode()]);

  if (mode === 'unlocked') redirect('/');

  if (userId && mode !== 'waitlist-only') redirect('/');

  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4 md:px-8">
          <Link href="/waitlist" className="flex items-center gap-2.5">
            <GlassIconBadge icon={Headphones} size="sm" />
            <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
              Playlist Playoff
            </span>
          </Link>
        </div>
      </header>

      <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-20 text-center md:px-8">
        <h1 className="mb-2 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Join the waitlist
        </h1>
        <p className="mb-8 max-w-sm text-sm text-zinc-400">
          We're onboarding in waves- enter your email and we'll let you know the second a spot opens up.
        </p>
        <Waitlist />
      </div>

      <Footer />
    </main>
  );
}
