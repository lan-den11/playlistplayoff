'use client';

import { m } from 'framer-motion';
import { Link2, Play, Trophy } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import Glow from '../ui/Glow';

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

// Reverted the Round 2 additions (connector arrows between cards, icon
// rotate+scale on hover) — numbers were unreadable and the arrows read as
// clutter. Step number bumped to text-zinc-400 (the design system's own
// "secondary text" color) since text-zinc-600 was nearly invisible against
// the card background.
export default function HowItWorks() {
  return (
    <section className="relative overflow-x-clip px-6 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
      <Glow tone="brand" className="-top-28 left-1/2 h-[26rem] w-[56rem] max-w-full -translate-x-1/2" />

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="mx-auto mb-10 max-w-2xl text-center md:mb-12"
      >
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          How it works
        </h2>
      </m.div>

      <m.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"
      >
        {STEPS.map((step) => (
          <m.div
            key={step.number}
            variants={card}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-[translate,border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.07] md:hover:[translate:0_-4px]"
          >
            <span className="font-display text-sm font-bold text-zinc-400">{step.number}</span>

            <div className="mt-4 mb-5 inline-block">
              <GlassIconBadge icon={step.icon} size="lg" />
            </div>

            <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-50">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{step.body}</p>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
