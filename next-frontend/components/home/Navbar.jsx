'use client';

import { Headphones } from 'lucide-react';
import GradientButton from '../ui/GradientButton';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 md:px-8">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
            <Headphones className="h-5 w-5 text-zinc-950" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-zinc-50">
            Playlist Playoff
          </span>
        </div>

        <GradientButton className="hidden sm:inline-flex" gradient="violet">
          Start a bracket
        </GradientButton>
      </div>
    </header>
  );
}
