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

const clerkAppearance = {
  variables: {
    colorPrimary: '#8b5cf6',
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
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </body>
      </html>
    </ClerkProvider>
  );
}
