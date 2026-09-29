'use client';

import Link from 'next/link';
import { m } from 'framer-motion';
import { Headphones } from 'lucide-react';
import GlassIconBadge from './GlassIconBadge';

export default function SiteHeader({ logoHref = '/', children }) {
  return (
    <m.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="sticky top-0 z-40 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md shadow-lg shadow-black/20"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-6 md:px-8">
        <Link
          href={logoHref}
          className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-95"
        >
          <span className="transition-transform duration-300 group-hover:scale-110">
            <GlassIconBadge icon={Headphones} size="sm" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
            Playlist Playoff
          </span>
        </Link>
        <div className="flex flex-none items-center gap-3">{children}</div>
      </div>
    </m.header>
  );
}
