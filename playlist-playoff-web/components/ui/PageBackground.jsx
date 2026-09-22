'use client';

import { useEffect, useState } from 'react';
import GhostFibers from './GhostFibers';
import DotGrid from './DotGrid';

// Sits behind the entire page, pinned to the viewport with `fixed` (not tied
// to document height) so the ghost-fiber effect stays visible everywhere as
// the page scrolls, at a consistent size no matter the viewport. The
// gradient scrim adds a light-top/dark-bottom vignette on top, which also
// doubles as the "depth" pass for sections lower on the page.
//
// Layer order is explicit (z-0 → z-10 → z-20) rather than left to DOM order:
// fibers (WebGL) → interactive dot grid → scrim. The dots are guaranteed to
// paint in front of the fibers; the scrim sits over both so the dots fade
// with the same vignette, and the grid wrapper's opacity keeps the resting
// dots a texture, not a pattern.
//
// Colors: fibers use brand-deep / brand (#0A1A6B / #1240EA). The dots are
// deliberately a lighter, softer blue than the fibers' glow so they read as
// their own layer instead of blending into it — resting #5C80F7, lit
// (near the pointer) #B4C8FF. All hue ~225-231deg (true blue, no violet).
// Keep in sync with the `brand` tokens in tailwind.config.js.
//
// PERFORMANCE GOVERNOR. The shader repaints the layer under every glass
// (backdrop-blur) panel, so its cost multiplies across the whole page. The
// background therefore runs at a quality tier:
//   - starts at a tier picked from the device (cores / memory / data-saver),
//   - steps DOWN if the page can't hold a smooth frame rate for a sustained
//     stretch (never back up, so it can't flap),
//   - remembers the result for the rest of the session (sessionStorage),
//     so /waitlist doesn't re-learn what the homepage already found out.
// The two lowest tiers also flip <html data-perf="lite"> (see globals.css),
// which drops backdrop blur; the last tier freezes the shader to one frame.
//
// `fps` values sit just above the intended rate (31 → 30fps, 21 → 20,
// 16 → 15): GhostFibers' limiter needs each gap to be ≥ 1000/fps − 0.5ms, and
// at 60Hz two vsyncs are 33.3ms — a plain "30" (32.83ms threshold) can miss
// on timestamp jitter and silently halve to 20fps.
// `dpr` is the shader's render scale: it renders at that fraction of CSS
// pixels and the browser upscales it, which is invisible on soft fibers.
const TIERS = [
  { dpr: 0.75, fps: 31, lite: false, paused: false },
  { dpr: 0.6, fps: 21, lite: false, paused: false },
  { dpr: 0.5, fps: 16, lite: true, paused: false },
  { dpr: 0.5, fps: 16, lite: true, paused: true },
];

const TIER_STORAGE_KEY = 'ppBackgroundTier';
const SETTLE_MS = 3000; // ignore load/hydration jank before judging
const WINDOW_FRAMES = 90; // ~1.5s per measurement window at 60Hz
const SLOW_FRAME_MS = 28; // avg rAF gap above this ≈ under 36fps

function deviceStartTier() {
  const nav = window.navigator;
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  if (nav.connection?.saveData || memory <= 2 || cores <= 2) return 2;
  if (memory <= 4 || cores <= 4) return 1;
  return 0;
}

function readStoredTier() {
  try {
    const value = Number(window.sessionStorage.getItem(TIER_STORAGE_KEY));
    return Number.isInteger(value) && value >= 0 && value < TIERS.length ? value : 0;
  } catch {
    return 0;
  }
}

export default function PageBackground() {
  // null until mounted: the fibers only mount once the tier is known, so a
  // weak device never spins up a full-quality WebGL context just to tear it
  // down a frame later.
  const [tier, setTier] = useState(null);

  useEffect(() => {
    setTier(Math.max(deviceStartTier(), readStoredTier()));
  }, []);

  useEffect(() => {
    if (tier === null) return;
    try {
      window.sessionStorage.setItem(TIER_STORAGE_KEY, String(tier));
    } catch {
      // storage unavailable — the tier just isn't remembered
    }
    const root = document.documentElement;
    if (TIERS[tier].lite) root.dataset.perf = 'lite';
    else delete root.dataset.perf;
  }, [tier]);

  useEffect(() => () => {
    delete document.documentElement.dataset.perf;
  }, []);

  useEffect(() => {
    if (tier === null || tier >= TIERS.length - 1) return;

    let rafId = 0;
    let last = 0;
    let sum = 0;
    let count = 0;
    let slowWindows = 0;
    const startAt = performance.now() + SETTLE_MS;

    const loop = (now) => {
      rafId = requestAnimationFrame(loop);
      if (document.hidden || now < startAt) {
        last = 0;
        return;
      }
      if (last) {
        sum += Math.min(now - last, 250);
        count += 1;
      }
      last = now;
      if (count < WINDOW_FRAMES) return;

      slowWindows = sum / count > SLOW_FRAME_MS ? slowWindows + 1 : 0;
      sum = 0;
      count = 0;
      if (slowWindows >= 2) setTier((current) => Math.min((current ?? 0) + 1, TIERS.length - 1));
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tier]);

  const config = tier === null ? null : TIERS[tier];

  return (
    // h-screen with an `lvh` upgrade: `inset-0` on a fixed layer tracks the
    // *visible* viewport, so on phones every time the URL bar collapses the
    // layer resized → the WebGL canvas and the dot grid were rebuilt mid-scroll.
    // The large-viewport height never changes.
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 -z-10 h-screen w-full supports-[height:100lvh]:h-[100lvh]"
    >
      {config && (
        <GhostFibers
          lineColor="#0A1A6B"
          glowColor="#1240EA"
          brightness={1.6}
          glowIntensity={1.3}
          speed={0.16}
          dpr={config.dpr}
          fps={config.fps}
          paused={config.paused}
          className="z-0"
        />
      )}
      <div className="absolute inset-0 z-10 opacity-80">
        <DotGrid
          dotSize={4.5}
          gap={28}
          baseColor="#5C80F7"
          activeColor="#B4C8FF"
          proximity={140}
          shockRadius={220}
          shockStrength={4}
        />
      </div>
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-zinc-950/10 via-zinc-950/55 to-zinc-950/85" />
    </div>
  );
}
