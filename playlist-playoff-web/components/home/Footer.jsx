'use client';

import Link from 'next/link';
import { m } from 'framer-motion';
import { Headphones } from 'lucide-react';

export default function Footer() {
  return (
    <m.footer
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.8 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="border-t border-white/5"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-sm text-zinc-500 md:flex-row md:px-8">
        <Link href="/" className="flex items-center gap-2 transition-colors hover:text-zinc-300">
          <Headphones className="h-4 w-4" />
          <span>Playlist Playoff</span>
        </Link>
        <p>© {new Date().getFullYear()} Playlist Playoff.</p>
      </div>
    </m.footer>
  );
}
