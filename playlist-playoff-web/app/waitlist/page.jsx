import { Waitlist } from '@clerk/nextjs';
import Navbar from '../../components/home/Navbar';
import Footer from '../../components/home/Footer';

export const metadata = {
  title: 'Playlist Playoff — Join the Waitlist',
  description: "Register your interest — we'll let you know the moment Playlist Playoff opens up.",
};

// Dedicated, app-styled destination for Clerk's Waitlist mode (see
// app/layout.jsx's `waitlistUrl="/waitlist"` on <ClerkProvider>). Once
// Waitlist mode is switched on in the Clerk Dashboard, this is where the
// sign-in modal and any other Clerk-driven flow will send new visitors
// instead of Clerk's generic Account Portal page. The <Waitlist /> form
// itself already inherits the dark/violet theme from the `appearance` prop
// on <ClerkProvider>, so no extra styling is needed here beyond the page
// shell.
export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-zinc-950">
      <Navbar />
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
