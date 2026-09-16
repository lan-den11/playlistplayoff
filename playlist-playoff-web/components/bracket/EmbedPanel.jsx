'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function EmbedPanel({ elRef, loading, gradient, height }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0">
      <div
        ref={elRef}
        className="min-h-[80px] w-full sm:min-h-[152px]"
        // `height` comes straight from useSpotifyEmbed, measured off this
        // same container's actual rendered width rather than assumed from
        // the viewport — see that hook for why. Setting it here guarantees
        // the wrapper's height always matches exactly what was requested
        // from Spotify, so there's no size mismatch for the iframe to try
        // to reconcile with an internal scrollbar.
        style={height ? { height: `${height}px`, minHeight: `${height}px` } : undefined}
      />
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
