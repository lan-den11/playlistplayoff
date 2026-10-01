'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const GhostFibers = dynamic(() => import('./GhostFibers'), { ssr: false });
const DotGrid = dynamic(() => import('./DotGrid'), { ssr: false });

const TIERS = [
  { dpr: 0.75, fps: 31, lite: false, paused: false },
  { dpr: 0.6, fps: 21, lite: false, paused: false },
  { dpr: 0.5, fps: 16, lite: true, paused: false },
  { dpr: 0.5, fps: 16, lite: true, paused: true },
];

const TIER_STORAGE_KEY = 'ppBackgroundTier';
const SETTLE_MS = 800;
const WINDOW_FRAMES = 36;
const SLOW_FRAME_MS = 28;
const SLOW_WINDOWS_TO_DOWNGRADE = 2;
const SCROLL_IDLE_MS = 140;

const isCoarsePointer = () => window.matchMedia('(pointer: coarse)').matches;

function deviceStartTier() {
  const nav = window.navigator;
  const cores = nav.hardwareConcurrency || 8;
  const memory = nav.deviceMemory || 8;
  if (nav.connection?.saveData || memory <= 2 || cores <= 2) return 2;
  if (memory <= 4 || cores <= 4 || isCoarsePointer()) return 1;
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
  const [tier, setTier] = useState(null);
  const [dpr, setDpr] = useState(TIERS[0].dpr);
  const [coarse, setCoarse] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    const start = Math.max(deviceStartTier(), readStoredTier());
    setTier(start);
    setDpr(TIERS[start].dpr);
    setCoarse(isCoarsePointer());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    let active = false;
    const onScroll = () => {
      if (!active) {
        active = true;
        root.dataset.scrolling = '1';
        setScrolling(true);
      }
      clearTimeout(timer);
      timer = setTimeout(() => {
        active = false;
        delete root.dataset.scrolling;
        setScrolling(false);
      }, SCROLL_IDLE_MS);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
      delete root.dataset.scrolling;
    };
  }, []);

  useEffect(() => {
    if (tier === null) return;
    try {
      window.sessionStorage.setItem(TIER_STORAGE_KEY, String(tier));
    } catch {}
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
      if (slowWindows >= SLOW_WINDOWS_TO_DOWNGRADE) {
        slowWindows = 0;
        setTier((current) => Math.min((current ?? 0) + 1, TIERS.length - 1));
      }
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [tier]);

  const config = tier === null ? null : TIERS[tier];

  const wrapperClass =
    'pointer-events-none fixed left-0 top-0 -z-10 h-screen w-full supports-[height:100lvh]:h-[100lvh]';

  return (
    <div aria-hidden="true" className={wrapperClass}>
      {config && (
        <>
          <GhostFibers
            lineColor="#0A1A6B"
            glowColor="#1240EA"
            brightness={1.6}
            glowIntensity={1.3}
            speed={0.16}
            dpr={dpr}
            fps={config.fps}
            paused={config.paused || scrolling}
            className="z-0 animate-fade-in"
          />
          <div className="absolute inset-0 z-10 opacity-80">
            <DotGrid
              dotSize={4.5}
              gap={28}
              baseColor="#5C80F7"
              activeColor="#B4C8FF"
              proximity={140}
              shockRadius={coarse ? 0 : 220}
              shockStrength={4}
              className="animate-fade-in"
            />
          </div>
        </>
      )}
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-zinc-950/10 via-zinc-950/55 to-zinc-950/85" />
    </div>
  );
}
