'use client';

import { useEffect, useRef, useState } from 'react';
import { fetchMatchupCounter } from '../../lib/api';

const POLL_MS = 10_000;
const TWEEN_MS = 600;

// Ticks smoothly from one integer to the next over TWEEN_MS instead of
// snapping — pure requestAnimationFrame, no extra dependency.
function useTweenedNumber(target) {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  const rafRef = useRef(0);

  useEffect(() => {
    if (target === fromRef.current) return;
    const from = fromRef.current;
    const start = performance.now();

    const step = (now) => {
      const t = Math.min(1, (now - start) / TWEEN_MS);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setDisplay(Math.round(from + (target - from) * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(step);
      else fromRef.current = target;
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target]);

  return display;
}

// Social-proof pill for the hero: a pulsing "live" dot + a matchups-decided
// count that ticks up as it polls. Counts real picks from EVERY visitor
// (trial and, later, real brackets — see hooks/useBracket.js), so it hides
// itself entirely rather than show a number when DATABASE_URL isn't
// configured (see app/api/counters/matchup/route.js) — no fake urgency.
export default function LiveCounter({ className = '' }) {
  const [value, setValue] = useState(null);
  const [configured, setConfigured] = useState(true);
  const displayValue = useTweenedNumber(value ?? 0);

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

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs text-zinc-400 backdrop-blur-md [data-theme=light]:border-black/10 [data-theme=light]:bg-black/5 [data-theme=light]:text-zinc-600 ${className}`}
    >
      <span className="relative flex h-2 w-2 flex-none">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      <span className="font-semibold text-zinc-200 [data-theme=light]:text-zinc-800">
        {displayValue.toLocaleString()}
      </span>
      matchups decided
    </div>
  );
}
