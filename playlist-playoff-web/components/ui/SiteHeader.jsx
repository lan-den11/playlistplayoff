'use client';

import Link from 'next/link';
import { Headphones } from 'lucide-react';
import GlassIconBadge from './GlassIconBadge';

// Sticky, always-glass header — consistent with the bracket page's header
// (BracketHeader.jsx) instead of fading in only after scrolling. Height
// stays fixed (h-14 + border = 57px) either way, so Hero.jsx's
// NAVBAR_HEIGHT_PX reserve is unaffected.
export default function SiteHeader({ logoHref = '/', children }) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-6 md:px-8">
        <Link href={logoHref} className="flex items-center gap-2.5">
          <GlassIconBadge icon={Headphones} size="sm" />
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
            Playlist Playoff
          </span>
        </Link>
        <div className="flex flex-none items-center gap-3">{children}</div>
      </div>
    </header>
  );
}
