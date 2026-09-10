import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Headphones } from 'lucide-react';
import { Waitlist } from '@clerk/nextjs';
import Footer from '../../components/home/Footer';

export const metadata = {
  title: 'Playlist Playoff — Join the Waitlist',
  description: "Register your interest — we'll let you know the moment Playlist Playoff opens up.",
};

// FIX (this round): this page used to render the full marketing <Navbar />,
// whose "Start a bracket" button pointed at /bracket — a route that, now
// that the whole app is gated (see proxy.js), would just bounce a
// signed-out visitor straight back here. Swapped in a minimal logo-only
// header instead, so nothing on this page promises access it can't deliver
// yet.
//
// Also now a server component that checks auth directly: proxy.js only ever
// SENDS signed-out visitors here, but someone already signed in could still
// bookmark or type this URL manually — send them on to the real app instead
// of showing them a waitlist form they don't need.
export default async function WaitlistPage() {
  const { userId } = await auth();
  if (userId) redirect('/');

  return (
    <main className="min-h-screen bg-zinc-950">
      <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4 md:px-8">
          <Link href="/waitlist" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500">
              <Headphones className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
            </span>
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
          We're onboarding in waves — pop your email in and we'll let you know the second a spot opens up.
        </p>
        <Waitlist />
      </div>

      <Footer />
    </main>
  );
}
