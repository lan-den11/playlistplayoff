'use client';

import { AnimatePresence, m } from 'framer-motion';
import { EMBED_HEIGHT } from '../../hooks/useSpotifyEmbed';
import Bone from '../ui/Bone';

function EmbedSkeleton() {
  return (
    <>
      <Bone className="h-14 w-14 flex-none rounded-lg" />
      <span className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Bone className="h-3 w-3/5 rounded-full" />
        <Bone className="h-2.5 w-2/5 rounded-full" />
      </span>
      <Bone className="h-9 w-9 flex-none rounded-full" />
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
          <m.div
            key={variant}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
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
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
