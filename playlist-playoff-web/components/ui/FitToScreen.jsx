'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

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
      className={`relative flex w-full items-center justify-center ${
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
