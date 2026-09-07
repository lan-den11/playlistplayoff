'use client';

import { motion } from 'framer-motion';
import { Link2, Play, Trophy } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Link2,
    title: 'Paste a playlist.',
    body: "Yours, a friend's, anyone's — public Spotify playlists work instantly.",
  },
  {
    number: '02',
    icon: Play,
    title: 'Pick a winner.',
    body: "Real embedded playback on every song, so you're actually listening, not guessing from a title.",
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Crown a champion.',
    body: 'See the full bracket, share the results, run it again with a different playlist.',
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
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
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
        className="grid gap-6 md:grid-cols-3"
      >
        {STEPS.map((step) => (
          <motion.div
            key={step.number}
            variants={card}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
          >
            <span className="font-display text-sm font-bold text-zinc-600">{step.number}</span>

            <div className="mt-4 mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400">
              <step.icon className="h-6 w-6 text-zinc-950" strokeWidth={2.25} />
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
