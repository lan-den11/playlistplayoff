'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Headphones } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import GlassIconBadge from '../ui/GlassIconBadge';

export default function Navbar({ accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <GlassIconBadge icon={Headphones} size="sm" />
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
            Playlist Playoff
          </span>
        </Link>

        <GradientButton
          gradient="brand"
          className="hidden sm:inline-flex"
          onClick={() => router.push(isOpen ? '/bracket' : '/waitlist')}
        >
          {isOpen ? 'Start a bracket' : 'Join the waitlist'}
        </GradientButton>
      </div>
    </header>
  );
}
