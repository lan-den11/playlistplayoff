import { Inter, Space_Grotesk } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { MotionConfig } from 'framer-motion';
import PostHogIdentity from '../components/PostHogIdentity';
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

const clerkAppearance = {
  variables: {
    colorPrimary: '#3437A0',
    colorBackground: '#09090b',
    colorInput: '#18181b',
    colorInputForeground: '#fafafa',
    colorForeground: '#fafafa',
    colorDanger: '#fb7185',
    colorSuccess: '#34d399',
    borderRadius: '1rem',
    fontFamily: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
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
    formFieldInput: 'bg-white/5 border border-white/10 text-zinc-50 rounded-xl focus:border-brand/50',
    formButtonPrimary:
      'bg-white/10 backdrop-blur-md border border-brand/40 hover:bg-white/15 hover:border-brand/60 text-zinc-50 font-semibold rounded-full shadow-none normal-case transition-colors',
    footerActionText: 'text-zinc-400',
    footerActionLink: 'text-brand-light hover:text-white',
    identityPreviewText: 'text-zinc-300',
    identityPreviewEditButton: 'text-brand-light',
    otpCodeFieldInput: 'bg-white/5 border border-white/10 text-zinc-50 rounded-xl',
    formResendCodeLink: 'text-brand-light hover:text-white',
    formFieldSuccessText: 'text-emerald-400',
    formFieldErrorText: 'text-rose-400',
    userButtonPopoverCard: 'bg-zinc-900/95 border border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl',
    userButtonPopoverActionButton: 'text-zinc-300 hover:bg-white/5',
    userButtonPopoverActionButtonText: 'text-zinc-300',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider afterSignOutUrl="/" waitlistUrl="/waitlist" appearance={clerkAppearance}>
      <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
        <body className="font-sans antialiased">
          <PostHogIdentity />
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </body>
      </html>
    </ClerkProvider>
  );
}
