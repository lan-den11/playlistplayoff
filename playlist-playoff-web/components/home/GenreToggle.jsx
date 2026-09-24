'use client';

import { captureEvent } from '../../lib/posthog-client';

// Pill tab row above the hero trial. `genres` is the full list including
// Trending (always first, always present); anything past it only shows up
// once its PostHog flag has a playlist configured — see
// lib/posthog-server.js `getGenrePlaylists`. Selecting a tab is what causes
// Hero to remount HeroMatchup with a new key, giving each genre a fully
// fresh trial rather than trying to hot-swap state mid-bracket.
//
// Plain CSS transitions rather than a framer-motion layout animation for the
// active pill: layout animations need the heavier `domMax` feature bundle
// (see components/MotionProvider.jsx, which intentionally loads the lighter
// `domAnimation` set instead) — not worth doubling that bundle for one pill.
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
                ? 'scale-105 border-transparent bg-gradient-to-b from-brand to-brand-deep text-zinc-50 shadow-[0_4px_12px_rgba(18,64,234,0.35)] [data-theme=light]:text-white'
                : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-200 [data-theme=light]:border-black/10 [data-theme=light]:bg-black/5 [data-theme=light]:text-zinc-500 [data-theme=light]:hover:text-zinc-800'
            }`}
          >
            {genre.label}
          </button>
        );
      })}
    </div>
  );
}
