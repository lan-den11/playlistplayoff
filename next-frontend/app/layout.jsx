import { Inter, Space_Grotesk } from 'next/font/google';
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body className="font-sans antialiased bg-zinc-950 text-zinc-50">
        {children}
      </body>
    </html>
  );
}