'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * Spotify embed host + fake-loading overlay. Pulled out of BattleScreen so
 * the homepage's HeroMatchup teaser can share the exact same real-playback
 * treatment instead of a static, non-playable mockup card.
 *
 * `elRef` must be the CALLBACK ref returned by useSpotifyEmbed() (not a
 * plain useRef object) — see hooks/useSpotifyEmbed.js for why that matters.
 *
 * BUG FIX (this round): this overlay is purely informational — a "Loading…"
 * spinner sitting on top of the embed while the fake 550ms delay plays out —
 * but it never had `pointer-events-none`. That's the exact same class of bug
 * that was already found and fixed on BattleScreen's round-announcement
 * flash (see the comment there): a transition should never be able to eat
 * clicks/taps it doesn't need. This panel is shared by BattleScreen,
 * HeroMatchup, and ChampionScreen, so the fix here covers all three at once.
 * If this overlay was ever left visible longer than intended (a slow
 * network, a Spotify iframe API that's slow to respond), it would have sat
 * there silently blocking interaction with the embed underneath it — which
 * matches "there's an overlay over it" exactly.
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
