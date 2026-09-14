'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Headphones } from 'lucide-react';
import GradientButton from '../ui/GradientButton';

export default function Navbar() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md">
            <Headphones className="h-5 w-5 text-zinc-50" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
            Playlist Playoff
          </span>
        </Link>

        <GradientButton gradient="brand" className="hidden sm:inline-flex" onClick={() => router.push('/bracket')}>
          Start a bracket
        </GradientButton>
      </div>
    </header>
  );
}
