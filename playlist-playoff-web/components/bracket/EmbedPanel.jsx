'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { EMBED_HEIGHT } from '../../hooks/useSpotifyEmbed';

// Root cause of the "blank space under the embed" bug: this panel used to be
// auto-height while the iframe inside it is forced to `h-full`. A percentage
// height against an auto-height parent resolves to `auto`, and for an
// <iframe> that means the browser default of 150px — overriding the height
// Spotify set on it. Spotify then drew its 80px compact card at the top of a
// 150px iframe and left the rest empty. The panel now has an explicit height
// (the same EMBED_HEIGHT handed to Spotify), so `h-full` resolves to exactly
// the embed's height. `box-content` keeps the 1px borders out of that height
// so the iframe gets the full EMBED_HEIGHT rather than 2px less.
//
// `variant` picks what covers the embed while `loading` is true:
//   'spinner'  — the small spinner + "Loading…" (default; battle/champion)
//   'skeleton' — a pulsing placeholder shaped like Spotify's compact card
//                (art, two text lines, play button). Same box, so nothing
//                shifts when it fades out onto the real embed.
function EmbedSkeleton() {
  return (
    <>
      <span className="h-14 w-14 flex-none animate-pulse rounded-lg bg-white/10" />
      <span className="flex min-w-0 flex-1 flex-col gap-2.5">
        <span className="h-3 w-3/5 animate-pulse rounded-full bg-white/10" />
        <span className="h-2.5 w-2/5 animate-pulse rounded-full bg-white/[0.07]" />
      </span>
      <span className="h-9 w-9 flex-none animate-pulse rounded-full bg-white/10" />
      <span className="sr-only">Loading…</span>
    </>
  );
}

export default function EmbedPanel({ elRef, loading, gradient, height = EMBED_HEIGHT, variant = 'spinner' }) {
  const isSkeleton = variant === 'skeleton';

  return (
    <div
      style={{ height }}
      className="relative box-content w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
    >
      <div ref={elRef} className="h-full w-full" />
      <AnimatePresence>
        {loading && (
          <motion.div
            key={variant}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none absolute inset-0 flex items-center ${
              isSkeleton
                ? 'gap-3 bg-zinc-950/90 px-4'
                : 'justify-center gap-2 bg-zinc-950/80 text-xs text-zinc-400'
            }`}
          >
            {isSkeleton ? (
              <EmbedSkeleton />
            ) : (
              <>
                <span className={`h-3 w-3 animate-spin rounded-full border-2 border-t-transparent bg-gradient-to-r ${gradient}`} />
                Loading…
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
