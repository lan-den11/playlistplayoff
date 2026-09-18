'use client';

import { AnimatePresence, motion } from 'framer-motion';

export default function EmbedPanel({ elRef, loading, gradient, height }) {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md [&_iframe]:block [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0">
      <div
        ref={elRef}
        // Always start at the compact (80px) floor instead of switching to
        // a 152px floor at the `sm:` viewport breakpoint. `sm:` only knows
        // the *viewport* width, not this panel's actual column width — in
        // the two-column battle layout (`md:` and up) each column is often
        // under the true 380px compact threshold even though the viewport
        // itself is well past `sm:`. That mismatch briefly reserved 152px
        // of empty space before the real measurement (from
        // useSpotifyEmbed) shrank it back down to 80px — the "too big at
        // the bottom" jump. The inline style below still grows it to
        // 152px immediately once the real width is measured, so nothing
        // is lost — it just never over-reserves first.
        className="min-h-[80px] w-full"
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
