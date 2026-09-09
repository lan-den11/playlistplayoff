import { Inter, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { MotionConfig } from 'framer-motion';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

export const metadata = {
  title: 'Playlist Playoff — Turn any playlist into a showdown',
  description:
    'Pick winners, song by song, until one track takes the crown — with your actual listening history built in.',
};

// Every color/radius/font below is pulled straight from this app's own
// Tailwind design system (globals.css + tailwind.config.js) so Clerk's
// hosted UI — the sign-in modal, the UserButton popover, and the new
// /waitlist page — reads as part of Playlist Playoff instead of a
// bolted-on default Clerk widget. Direct hex values are used instead of
// CSS vars, since Clerk's theming layer leans on color-mix()/relative-color
// syntax that doesn't reliably wrap arbitrary custom properties yet.
//
// NOTE for Landen: unrecognized keys here are just silently ignored by
// Clerk (this is a plain object, not TypeScript), so if any single class
// below doesn't visually land once you look at it with real Clerk keys,
// it's a one-line fix — nothing else breaks.
const clerkAppearance = {
  variables: {
    colorPrimary: '#8b5cf6', // violet-500 — same brand accent as GradientButton
    colorBackground: '#09090b', // zinc-950 — same "deep midnight" base as the rest of the app
    colorInput: '#18181b', // zinc-900
    colorInputForeground: '#fafafa', // zinc-50
    colorForeground: '#fafafa', // zinc-50
    colorDanger: '#fb7185', // rose-400 — matches the app's existing error text color
    colorSuccess: '#34d399', // emerald-400 — matches the "You're on the list" state
    borderRadius: '1rem',
    fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    // The SignInButton modal (BracketHeader.jsx) and any Account-Portal-style
    // pages both route through these — glass card, no default white flash.
    modalBackdrop: 'bg-zinc-950/70 backdrop-blur-sm',
    modalContent: 'bg-transparent shadow-none',
    card: 'bg-zinc-900/90 border border-white/10 backdrop-blur-xl shadow-2xl rounded-3xl',
    headerTitle: 'font-display font-bold tracking-tight text-zinc-50',
    headerSubtitle: 'text-zinc-400',
    dividerLine: 'bg-white/10',
    dividerText: 'text-zinc-500',
    socialButtonsBlockButton: 'border border-white/10 bg-white/5 hover:bg-white/10 text-zinc-50 rounded-full',
    socialButtonsBlockButtonText: 'text-zinc-50 font-semibold',
    formFieldLabel: 'text-zinc-300',
    formFieldInput: 'bg-white/5 border border-white/10 text-zinc-50 rounded-xl focus:border-violet-400/50',
    formButtonPrimary:
      'bg-gradient-to-r from-violet-500 to-indigo-500 hover:opacity-90 text-zinc-950 font-semibold rounded-full shadow-none normal-case',
    footerActionText: 'text-zinc-400',
    footerActionLink: 'text-violet-400 hover:text-violet-300',
    identityPreviewText: 'text-zinc-300',
    identityPreviewEditButton: 'text-violet-400',
    otpCodeFieldInput: 'bg-white/5 border border-white/10 text-zinc-50 rounded-xl',
    formResendCodeLink: 'text-violet-400 hover:text-violet-300',
    formFieldSuccessText: 'text-emerald-400',
    formFieldErrorText: 'text-rose-400',
    // UserButton popover (BracketHeader.jsx)
    userButtonPopoverCard: 'bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl',
    userButtonPopoverActionButton: 'text-zinc-300 hover:bg-white/5',
    userButtonPopoverActionButtonText: 'text-zinc-300',
  },
};

export default function RootLayout({ children }) {
  return (
    // waitlistUrl points Clerk's waitlist flow (e.g. from the sign-in modal,
    // once Waitlist mode is switched on in the Clerk Dashboard) at OUR own
    // styled /waitlist page instead of Clerk's generic Account Portal page.
    <ClerkProvider afterSignOutUrl="/" waitlistUrl="/waitlist" appearance={clerkAppearance}>
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="font-sans antialiased">
          {/* AUDIT FIX (this round): the app had a CSS
              `@media (prefers-reduced-motion: reduce)` block in globals.css,
              but that only ever affects plain CSS transitions/animations —
              it does nothing for Framer Motion, which drives essentially
              every animation in this app (springs, whileHover/whileTap,
              AnimatePresence) via JS, not CSS `transition`/`animation`
              properties. So "reduced motion" was effectively a no-op for
              almost the whole UI. reducedMotion="user" is Framer Motion's
              own site-wide switch: with the OS setting on, it disables
              transform/layout animations everywhere while still letting
              opacity/color animate, with zero per-component changes needed. */}
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </body>
      </html>
    </ClerkProvider>
  );
}
