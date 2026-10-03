'use client';

import { useEffect, useState } from 'react';

const MAX_WAIT_MS = 700;

export function useAnimateReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let started = false;
    let raf = 0;

    const start = () => {
      if (started || cancelled) return;
      started = true;
      clearTimeout(timer);
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => {
          if (!cancelled) setReady(true);
        });
      });
    };

    const timer = setTimeout(start, MAX_WAIT_MS);
    if (document.fonts?.ready) document.fonts.ready.then(start);
    else start();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, []);

  return ready;
}
