'use client';

import Link from 'next/link';
import { Headphones } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import Reveal from '../ui/Reveal';
import { CONTACT_EMAIL } from '../../lib/contact';
import { OPEN_CONSENT_EVENT } from '../../lib/consent';

const LINK = 'transition-colors duration-200 hover:text-zinc-50';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <Reveal as="footer" amount={0.2} distance={16} className="relative mx-auto max-w-7xl px-6 pb-10 pt-4 md:px-8">
      <div className="flex flex-col items-center gap-5 border-t border-white/10 pt-8 text-center md:flex-row md:justify-between md:text-left">
        <Link href="/" className="group flex items-center gap-2.5 transition-transform duration-200 active:scale-95">
          <span className="transition-transform duration-300 group-hover:scale-110">
            <GlassIconBadge icon={Headphones} size="sm" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">Playlist Playoff</span>
        </Link>

        <nav aria-label="Legal" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-zinc-400">
          <Link href="/privacy" className={LINK}>
            Privacy Policy
          </Link>
          <Link href="/terms" className={LINK}>
            Terms of Service
          </Link>
          <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))} className={LINK}>
            Cookie settings
          </button>
          {CONTACT_EMAIL && (
            <a href={`mailto:${CONTACT_EMAIL}`} className={LINK}>
              Contact
            </a>
          )}
        </nav>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400 md:text-left">
        © {year} Playlist Playoff. Not affiliated with Spotify or Last.fm. Listening data provided by{' '}
        <a
          href="https://www.last.fm"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 transition-colors hover:text-zinc-200"
        >
          Last.fm
        </a>
        .
      </p>
    </Reveal>
  );
}
