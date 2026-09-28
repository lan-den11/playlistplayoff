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
      className="mx-auto mb-4 flex w-full max-w-lg flex-wrap justify-center gap-2 md:justify-start"
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
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'scale-105 border-transparent bg-gradient-to-b from-brand to-brand-deep text-zinc-50 shadow-[0_4px_12px_rgba(18,64,234,0.35)]'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 flex-none" />
            {genre.label}
          </button>
        );
      })}
    </m.div>
  );
}
