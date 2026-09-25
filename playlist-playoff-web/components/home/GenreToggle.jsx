'use client';

import { captureEvent } from '../../lib/posthog-client';

// Pill tab row above the hero trial. `genres` is the full list including
// Trending (always first, always present); anything past it only shows up
// once its PostHog flag has a playlist configured — see
// lib/posthog-server.js `getGenrePlaylists`. Selecting a tab updates
// `selected` in place — Hero/HeroMatchup no longer remount on switch (see
// HeroMatchup.jsx), so the trial's embeds and progress stay alive instead of
// reloading with a gray box.
export default function GenreToggle({ genres, selected, onSelect }) {
  if (genres.length <= 1) return null;

  return (
    <div className="mb-4 flex flex-wrap justify-center gap-2 md:justify-start">
      {genres.map((genre) => {
        const isActive = genre.key === selected;
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
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'scale-105 border-transparent bg-gradient-to-b from-brand to-brand-deep text-zinc-50 shadow-[0_4px_12px_rgba(18,64,234,0.35)]'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {genre.label}
          </button>
        );
      })}
    </div>
  );
}
