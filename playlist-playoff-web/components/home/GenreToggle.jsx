'use client';

import { m } from 'framer-motion';
import { Flame, Headphones, Music2, Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';

const GENRE_ICONS = {
  trending: Flame,
  hiphop: Headphones,
  pop: Sparkles,
  rock: Music2,
};

export default function GenreToggle({ genres, selected, onSelect }) {
  if (genres.length <= 1) return null;

  return (
    <m.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      className="mx-auto mb-3 flex w-full max-w-lg flex-nowrap justify-center gap-1.5 sm:gap-2 md:mb-4 md:justify-start"
    >
      {genres.map((genre) => {
        const isActive = genre.key === selected;
        const Icon = GENRE_ICONS[genre.key] || Music2;
        return (
          <button
            key={genre.key}
            type="button"
            onClick={() => {
              if (isActive) return;
              captureEvent('homepage_genre_selected', { genre: genre.key });
              onSelect(genre.key);
            }}
            aria-pressed={isActive}
            className={`inline-flex min-w-0 flex-1 items-center justify-center gap-1 whitespace-nowrap rounded-full border px-1.5 py-1.5 text-[11px] font-semibold transition-all duration-200 sm:flex-none sm:gap-1.5 sm:px-4 sm:text-xs ${
              isActive
                ? 'scale-105 border-transparent bg-gradient-to-b from-brand to-brand-deep text-zinc-50 shadow-[0_4px_12px_rgba(18,64,234,0.35)]'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="hidden h-3.5 w-3.5 flex-none min-[420px]:block" />
            {genre.label}
          </button>
        );
      })}
    </m.div>
  );
}
