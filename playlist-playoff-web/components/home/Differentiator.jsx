'use client';

import { useEffect, useRef, useState } from 'react';
import { m, useInView } from 'framer-motion';
import { BarChart3, Music2 } from 'lucide-react';
import { fetchAlbumArt } from '../../lib/api';
import Glow from '../ui/Glow';

function TrackDetailsMockup() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '300px' });
  const [albumArt, setAlbumArt] = useState(null);

  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    fetchAlbumArt('Kanye West', 'Graduation')
      .then((data) => {
        if (!cancelled) setAlbumArt(data.image || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [inView]);

  return (
    <m.div
      ref={ref}
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-14 w-14 flex-none items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-amber-500/25 to-brand/25 backdrop-blur-md">
          {albumArt ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={albumArt} alt="" className="h-full w-full object-cover" />
          ) : (
            <Music2 className="h-6 w-6 text-zinc-50" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight text-zinc-50">
            Homecoming
          </p>
          <p className="truncate text-sm text-zinc-400">Kanye West</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <BarChart3 className="h-3.5 w-3.5 text-brand-light" />
              Your plays
            </span>
            <span className="font-display font-bold text-zinc-50">247</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.35 }}
              className="h-full w-[88%] origin-left rounded-full bg-gradient-to-r from-brand to-brand-light"
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Global popularity</span>
            <span className="font-display font-bold text-zinc-500">34</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <m.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.8 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18, delay: 0.5 }}
              className="h-full w-[24%] origin-left rounded-full bg-zinc-600"
            />
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-400">
        This one barely charts — but it's your most played track in the bracket!
      </p>
    </m.div>
  );
}

export default function Differentiator() {
  return (
    <section className="relative overflow-x-clip px-6 py-14 md:px-8 md:py-20">
      <Glow tone="brand" className="-top-16 right-0 h-[28rem] w-[46rem] max-w-full opacity-70" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-16">
        <m.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="text-center md:text-left"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Not just a vote. Your true taste.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-zinc-400 md:mx-0">
            Link your Last.fm account and every matchup turns personal with your listening data. See what you
            actually listen to, not just what's trending.
          </p>
        </m.div>

        <TrackDetailsMockup />
      </div>
    </section>
  );
}
