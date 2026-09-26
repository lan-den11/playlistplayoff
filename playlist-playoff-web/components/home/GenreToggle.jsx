'use client';

import { Flame, Headphones, Music2, Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';

// One icon per genre key so the tab row reads as more crafted than plain
// text pills — falls back to Music2 for any future genre flag that isn't
// mapped here yet, so a new flag never renders an unlabeled tab.
const GENRE_ICONS = {
  trending: Flame,
  hiphop: Headphones,
  pop: Sparkles,
  rock: Music2,
};

// Pill tab row above the hero trial. `genres` is the full list including
// Trending (always first, always present); anything past it only shows up
// once its PostHog flag has a playlist configured — see
// lib/posthog-server.js `getGenrePlaylists`. Selecting a tab updates
// `selected` in place — Hero/HeroMatchup no longer remount on switch (see
// HeroMatchup.jsx), so the trial's embeds and progress stay alive instead of
// reloading with a gray box.
//
// `mx-auto max-w-lg` matches HeroMatchup's own card width exactly, so the
// pills and the card below share the same left/right edges at every
// breakpoint instead of the pills sitting off to one side.
export default function GenreToggle({ genres, selected, onSelect }) {
  if (genres.length <= 1) return null;

  return (
    <div className="mx-auto mb-4 flex w-full max-w-lg flex-wrap justify-center gap-2 md:justify-start">
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
    </div>
  );
}
