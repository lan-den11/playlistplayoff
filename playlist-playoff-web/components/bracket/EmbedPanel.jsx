'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * Spotify embed host + fake-loading overlay. Pulled out of BattleScreen so
 * the homepage's HeroMatchup teaser can share the exact same real-playback
 * treatment instead of a static, non-playable mockup card.
 *
 * `elRef` must be the CALLBACK ref returned by useSpotifyEmbed() (not a
 * plain useRef object) — see hooks/useSpotifyEmbed.js for why that matters.
 */
export default function EmbedPanel({ elRef, loading, gradient }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <div ref={elRef} className="min-h-[80px] sm:min-h-[152px]" />
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center gap-2 bg-zinc-950/80 text-xs text-zinc-400"
          >
            <span className={`h-3 w-3 animate-spin rounded-full border-2 border-t-transparent bg-gradient-to-r ${gradient}`} />
            Loading…
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
