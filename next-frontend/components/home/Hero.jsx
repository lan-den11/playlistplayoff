'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Music2 } from 'lucide-react';
import GradientButton from '../ui/GradientButton';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

function MatchupPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.4 }}
      className="relative mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Round of 16
      </p>

      <div className="flex items-center gap-3">
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex-1 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-3"
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-400">
            <Music2 className="h-4 w-4 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Night Drive</p>
          <p className="truncate text-xs text-zinc-400">Nocturn</p>
        </motion.div>

        <span className="font-display text-sm font-bold text-zinc-600">VS</span>

        <motion.div
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex-1 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-3"
        >
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-400">
            <Music2 className="h-4 w-4 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Golden Hour</p>
          <p className="truncate text-xs text-zinc-400">Marlowe</p>
        </motion.div>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-500 to-cyan-400" />
      </div>
      <p className="mt-2 text-center text-[11px] text-zinc-500">Battle 11 / 15</p>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-24 pt-20 md:px-8 md:pb-32 md:pt-28">
      {/* Ambient gradient orbs — the one place this page spends its "glow" budget generously */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-cyan-500/15 blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 md:grid-cols-2">
        <motion.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.h1
            variants={item}
            className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl"
          >
            Turn any playlist into a showdown.
          </motion.h1>

          <motion.p
            variants={item}
            className="mx-auto mt-6 max-w-lg text-lg text-zinc-400 md:mx-0"
          >
            Pick winners, song by song, until one track takes the crown — with your
            actual listening history built in, not just a vote.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex justify-center md:justify-start">
            <GradientButton gradient="violet">
              Start a bracket
              <ArrowRight className="h-4 w-4" />
            </GradientButton>
          </motion.div>
        </motion.div>

        <MatchupPreview />
      </div>
    </section>
  );
}
