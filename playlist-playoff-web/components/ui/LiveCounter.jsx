'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { fetchMatchupCounter } from '../../lib/api';

const POLL_MS = 10_000;

// Social-proof counter: matchups decided across EVERY visitor (trial and
// real brackets alike), polling every 10s. Hides itself entirely rather than
// show a number when DATABASE_URL isn't configured — no fake urgency.
//
// The number cross-fades as a single block (font-display, matching every
// other prominent number on the site — see OptionsScreen's song count)
// instead of animating per-digit. A per-digit slide sitting under this
// pill's backdrop-blur was losing subpixel antialiasing mid-transition
// (the blur) while its fixed-width, overflow-hidden digit boxes clipped
// the sliding glyph (the choppiness) — swapping the whole string at once
// removes both failure modes at the source.
//
// `compact`: small glass pill (border + bg-white/5 + backdrop-blur, like
// every other badge on the site). Brand-blue pulse dot to match the rest
// of the UI. Both the number and the "decided" label are zinc-50 so the
// pill reads as one consistent piece of text.
export default function LiveCounter({ className = '', compact = false }) {
  const [value, setValue] = useState(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    async function poll() {
      try {
        const data = await fetchMatchupCounter();
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        if (data.configured) setValue(data.value);
      } catch {
        // transient failure — next poll will retry; don't flip `configured`
        // off just because one request dropped
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!configured || value === null) return null;

  const display = value.toLocaleString();

  const number = (
    <span className="relative inline-grid">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={display}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="col-start-1 row-start-1 font-display tabular-nums text-zinc-50"
        >
          {display}
        </motion.span>
      </AnimatePresence>
    </span>
  );

  if (compact) {
    return (
      <span
        className={`inline-flex flex-none items-center gap-1.5 rounded-full border border-white/10 bg-white/5 py-1 pl-2 pr-2.5 backdrop-blur-md ${className}`}
      >
        <span className="relative flex h-1.5 w-1.5 flex-none">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-light" />
        </span>
        <span className="text-[11px] font-bold leading-none">{number}</span>
        <span className="hidden font-display text-[11px] font-semibold uppercase leading-none tracking-widest text-zinc-50 sm:inline">
          decided
        </span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur-md ${className}`}
    >
      <span className="relative flex h-2 w-2 flex-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-light opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-light" />
      </span>
      <span className="text-sm font-bold leading-none">{number}</span>
      matchups decided
    </div>
  );
}