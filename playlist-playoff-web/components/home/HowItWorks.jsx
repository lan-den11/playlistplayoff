'use client';

import { motion } from 'framer-motion';
import { Link2, Play, Trophy } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';

const STEPS = [
  {
    number: '01',
    icon: Link2,
    title: 'Pick a playlist.',
    body: 'Choose any public Spotify playlist to personalize your bracket experience.',
  },
  {
    number: '02',
    icon: Play,
    title: 'Select a winner.',
    body: 'Spotify playback embeds and listening history stats help influence your chosen matchup winner.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Crown a champion.',
    body: 'See the complete bracket, share results, and play again with a different playlist.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

export default function HowItWorks() {
  return (
    // overflow-x-clip (not overflow-hidden) + a -z-10 glow: the glow hangs
    // above this section's top edge, and overflow-hidden used to slice it off
    // right at the boundary — a hard tinted step between sections. Clipping
    // only the x-axis lets it fade out naturally into the neighbouring
    // sections; -z-10 keeps it behind their content (it still paints above
    // PageBackground, which comes first in <main>).
    <section className="relative overflow-x-clip px-6 py-24 md:px-8 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-[40rem] max-w-full -translate-x-1/2 rounded-full bg-brand/15 blur-[110px]"
      />

      <div className="mx-auto mb-16 max-w-2xl text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          How it works
        </h2>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"
      >
        {STEPS.map((step) => (
          <motion.div
            key={step.number}
            variants={card}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
          >
            <span className="font-display text-sm font-bold text-zinc-600">{step.number}</span>

            <div className="mt-4 mb-5">
              <GlassIconBadge icon={step.icon} size="lg" />
            </div>

            <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-50">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{step.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
