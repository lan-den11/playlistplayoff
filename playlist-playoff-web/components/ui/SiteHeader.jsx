import Link from 'next/link';
import { Headphones } from 'lucide-react';
import GlassIconBadge from './GlassIconBadge';

// Single source of truth for the "Playlist Playoff" wordmark row, shared by
// the homepage Navbar and the waitlist page so the logo can't drift between
// them. The two used to be separate markup: the Navbar row grew to ~48px
// (its CTA button) while the waitlist row stayed ~36px (logo only), so the
// wordmark sat ~6px lower on the homepage. A fixed row height (`h-14`) makes
// the logo's vertical center identical no matter what — or whether anything
// — sits on the right. Total header height = 56px + 1px border = 57px
// (Hero's NAVBAR_HEIGHT_PX mirrors this). Keep the row's tallest child (the
// Navbar's `size="sm"` button, ~36px) under 56px so the row never grows.
// Deliberately NOT sticky.
export default function SiteHeader({ logoHref = '/', children }) {
  return (
    <header className="border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 md:px-8">
        <Link href={logoHref} className="flex items-center gap-2.5">
          <GlassIconBadge icon={Headphones} size="sm" />
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">Playlist Playoff</span>
        </Link>
        {children}
      </div>
    </header>
  );
}
