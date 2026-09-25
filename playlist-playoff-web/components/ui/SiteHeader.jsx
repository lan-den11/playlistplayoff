'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Headphones } from 'lucide-react';
import GlassIconBadge from './GlassIconBadge';

// Sticky + scroll-adaptive: transparent over the hero at the very top of the
// page, then fades in its glass background, border and shadow once the
// visitor scrolls a little — a small "premium SaaS" touch instead of a
// header that's either always-glass or scrolls away with the page. Height
// stays fixed either way (h-14 + border = 57px), so Hero.jsx's
// NAVBAR_HEIGHT_PX reserve is unaffected — `sticky` keeps the element in
// normal document flow, unlike `fixed`.
export default function SiteHeader({ logoHref = '/', children }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 12);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled
          ? 'border-white/5 bg-zinc-950/70 shadow-lg shadow-black/20 backdrop-blur-md'
          : 'border-transparent bg-transparent'
      }`}
    >
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
