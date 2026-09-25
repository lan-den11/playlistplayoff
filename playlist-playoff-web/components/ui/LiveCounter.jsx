'use client';

import { useEffect, useState } from 'react';
import { fetchMatchupCounter } from '../../lib/api';
import OdometerNumber from './OdometerNumber';

const POLL_MS = 10_000;

// Social-proof counter: matchups decided across EVERY visitor (trial and,
// later, real brackets — see hooks/useBracket.js), polling every 10s.
// Hides itself entirely rather than show a number when DATABASE_URL isn't
// configured (see app/api/counters/matchup/route.js) — no fake urgency.
//
// `compact`: a plain inline "1,204 decided" reading with no pill/border,
// sized to sit inline in the trial card's header row next to the playlist
// name and round label (see HeroMatchup.jsx). Default (false) keeps the
// original standalone pill used elsewhere on the homepage.
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

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold text-zinc-400 ${className}`}>
        <span className="relative flex h-1.5 w-1.5 flex-none">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        <OdometerNumber value={value} className="text-zinc-200" />
        <span className="hidden sm:inline">decided</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur-md ${className}`}
    >
      <span className="relative flex h-2 w-2 flex-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="font-semibold text-zinc-200">
        <OdometerNumber value={value} />
      </span>
      matchups decided
    </div>
  );
}
