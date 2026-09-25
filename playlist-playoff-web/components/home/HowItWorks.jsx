'use client';

import { m } from 'framer-motion';
import { ArrowRight, Link2, Play, Trophy } from 'lucide-react';
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

const ICON_HOVER_SPRING = { type: 'spring', stiffness: 300, damping: 14 };

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
        {STEPS.map((step, i) => (
          <m.div
            key={step.number}
            variants={card}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-[translate,border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.07] md:hover:[translate:0_-4px]"
          >
            {/* Connects the steps into a visible flow on desktop — sits in
                the grid gap between cards, so it needs no extra layout. */}
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-600 md:flex"
              >
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            )}

            <span className="font-display text-sm font-bold text-zinc-600">
              {step.number}
            </span>

            <m.div
              whileHover={{ rotate: 6, scale: 1.08 }}
              transition={ICON_HOVER_SPRING}
              className="mt-4 mb-5 inline-block"
            >
              <GlassIconBadge icon={step.icon} size="lg" />
            </m.div>

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
