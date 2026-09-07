'use client';

import { motion } from 'framer-motion';
import { BarChart3, Music2 } from 'lucide-react';

function TrackDetailsMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500">
          <Music2 className="h-6 w-6 text-zinc-950" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight text-zinc-50">
            Slow Static
          </p>
          <p className="truncate text-sm text-zinc-400">Hollow Coast</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <BarChart3 className="h-3.5 w-3.5 text-violet-400" />
              Your plays
            </span>
            <span className="font-display font-bold text-zinc-50">247</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Global popularity</span>
            <span className="font-display font-bold text-zinc-500">34</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[24%] rounded-full bg-zinc-600" />
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-400">
        This one barely charts — but it's your most-played track in the bracket.
      </p>
    </motion.div>
  );
}

export default function Differentiator() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
      <div className="grid items-center gap-14 md:grid-cols-2 md:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="text-center md:text-left"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Not just a vote. Your actual taste.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-zinc-400 md:mx-0">
            Link Last.fm and every matchup shows your real play count for that
            song — not a popularity score, not a guess. See what you actually
            listen to face off, not just what's popular.
          </p>
        </motion.div>

        <TrackDetailsMockup />
      </div>
    </section>
  );
}
