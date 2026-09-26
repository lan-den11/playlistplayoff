'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Guarantees Hero content fits on the first screen — but ONLY at desktop/
// tablet widths (>= MOBILE_BREAKPOINT). On phones it gets out of the way
// entirely: no forced scale-down, no minHeight lock. Content renders at its
// natural size and the page scrolls exactly like a normal mobile page.
//
// Forcing a tall, stacked mobile layout down to fit one screen (scaling it
// as small as 55%) made every element harder to read and tap, and made the
// whole page feel "locked" — like scrolling wasn't working, when really the
// hero had just been shrunk down to a cramped block. Desktop/tablet keep the
// original behavior since there's room for it to look intentional there.
//
// Why these choices (unchanged from before, apply to the desktop path):
// - `100svh` (small viewport height), not dvh/innerHeight: it's constant while
//   iOS Safari's toolbars collapse on scroll, so the fit doesn't twitch
//   mid-scroll — and on load, when toolbars are expanded, it equals what's
//   actually visible. Read from a fixed probe element; if the browser is too
//   old to know `svh` the probe measures 0 and we fall back to innerHeight.
// - `offsetHeight` is layout-based and ignores transforms, so scaling never
//   feeds back into the measurement (no resize loops).
// - Transform (not `zoom`): Spotify's iframes scale as a bitmap with
//   transform, so the embed stays intact instead of being cropped.
// - The wrapper's height is set to the scaled height, so the page below flows
//   up against the scaled content instead of leaving a hole.
// - Hidden until first measured, so the server-rendered, unscaled layout
//   never flashes before hydration applies the fit. The reveal is a short
//   opacity fade (not an instant pop) so the hero settles in smoothly.
//
// The probe/content refs are ALWAYS rendered (never conditionally mounted),
// so the ResizeObserver keeps watching the same live DOM nodes whether the
// viewport is currently mobile or desktop — resizing across the breakpoint
// (rotating a tablet, resizing a window) re-measures correctly instead of
// leaving a stale observer watching detached nodes.
const MOBILE_BREAKPOINT = 768;

export default function FitToScreen({ reserve = 0, minScale = 0.55, children }) {
  const probeRef = useRef(null);
  const contentRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, natural: 0, avail: null, isMobile: null });

  const measure = useCallback(() => {
    const probe = probeRef.current;
    const content = contentRef.current;
    if (!probe || !content || typeof window === 'undefined') return;

    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    if (isMobile) {
      setFit((prev) => (prev.isMobile === true ? prev : { scale: 1, natural: 0, avail: null, isMobile: true }));
      return;
    }

    const viewport = probe.offsetHeight || window.innerHeight;
    const avail = Math.max(0, viewport - reserve);
    const natural = content.offsetHeight;
    const scale = natural > avail && natural > 0 ? Math.max(minScale, avail / natural) : 1;

    setFit((prev) =>
      prev.scale === scale && prev.natural === natural && prev.avail === avail && prev.isMobile === false
        ? prev
        : { scale, natural, avail, isMobile: false }
    );
  }, [reserve, minScale]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);
    observer.observe(probeRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  const { isMobile, scale, natural, avail } = fit;
  const scaled = isMobile === false && scale < 1;
  const measured = isMobile !== null;

  return (
    <div
      className={`relative flex w-full items-center justify-center transition-opacity duration-500 ease-out ${
        measured ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={isMobile ? undefined : { minHeight: avail ?? `calc(100svh - ${reserve}px)` }}
    >
      <div ref={probeRef} aria-hidden="true" className="pointer-events-none invisible fixed left-0 top-0 h-[100svh] w-0" />
      <div className="w-full" style={scaled ? { height: natural * scale } : undefined}>
        <div ref={contentRef} style={scaled ? { transform: `scale(${scale})`, transformOrigin: 'top center' } : undefined}>
          {children}
        </div>
      </div>
    </div>
  );
}
