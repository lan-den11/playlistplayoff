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
export default function EmbedPanel({ elRef, loading, gradient, height = EMBED_HEIGHT }) {
  return (
    <div
      style={{ height }}
      className="relative box-content w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
    >
      <div ref={elRef} className="h-full w-full" />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 bg-zinc-950/80 text-xs text-zinc-400"
          >
            <span className={`h-3 w-3 animate-spin rounded-full border-2 border-t-transparent bg-gradient-to-r ${gradient}`} />
            Loading…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
