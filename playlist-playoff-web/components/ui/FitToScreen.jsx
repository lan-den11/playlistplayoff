'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Guarantees its children fit on the first screen at ANY viewport size.
//
// It measures the children's natural height against the space actually
// available (small-viewport height minus `reserve`, i.e. navbar + section
// padding) and, only when they don't fit, scales them down with a CSS
// transform to exactly fill it. When they do fit, nothing is applied at all
// (no transform → no extra stacking context for the glass/backdrop-blur
// surfaces inside) and the content is simply centered in the space.
//
// Why these choices:
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
export default function FitToScreen({ reserve = 0, minScale = 0.55, children }) {
  const probeRef = useRef(null);
  const contentRef = useRef(null);
  const [fit, setFit] = useState({ scale: 1, natural: 0, avail: null });

  const measure = useCallback(() => {
    const probe = probeRef.current;
    const content = contentRef.current;
    if (!probe || !content) return;

    const viewport = probe.offsetHeight || window.innerHeight;
    const avail = Math.max(0, viewport - reserve);
    const natural = content.offsetHeight;
    const scale = natural > avail && natural > 0 ? Math.max(minScale, avail / natural) : 1;

    setFit((prev) =>
      prev.scale === scale && prev.natural === natural && prev.avail === avail ? prev : { scale, natural, avail }
    );
  }, [reserve, minScale]);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(contentRef.current);
    observer.observe(probeRef.current);
    return () => observer.disconnect();
  }, [measure]);

  const scaled = fit.scale < 1;
  const measured = fit.avail !== null;

  return (
    <div
      className={`relative flex w-full items-center justify-center transition-opacity duration-500 ease-out ${
        measured ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      style={{ minHeight: fit.avail ?? `calc(100svh - ${reserve}px)` }}
    >
      <div ref={probeRef} aria-hidden="true" className="pointer-events-none invisible fixed left-0 top-0 h-[100svh] w-0" />
      <div className="w-full" style={scaled ? { height: fit.natural * fit.scale } : undefined}>
        <div
          ref={contentRef}
          style={scaled ? { transform: `scale(${fit.scale})`, transformOrigin: 'top center' } : undefined}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
