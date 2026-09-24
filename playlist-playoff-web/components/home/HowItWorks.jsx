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

export default function HowItWorks() {
  return (
    // overflow-x-clip (not overflow-hidden) + a -z-10 glow: the glow hangs
    // above this section's top edge, and overflow-hidden used to slice it off
    // right at the boundary — a hard tinted step between sections. Clipping
    // only the x-axis lets it fade out naturally into the neighbouring
    // sections; -z-10 keeps it behind their content (it still paints above
    // PageBackground, which comes first in <main>). Top padding is smaller
    // than the bottom because the hero above already ends in its own 56px.
    <section className="relative overflow-x-clip px-6 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
      <Glow tone="brand" className="-top-28 left-1/2 h-[26rem] w-[56rem] max-w-full -translate-x-1/2" />

      <m.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="mx-auto mb-10 max-w-2xl text-center md:mb-12"
      >
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 [data-theme=light]:text-zinc-900 sm:text-4xl">
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
          // `translate` (the individual CSS property) instead of `transform`
          // for the hover lift: Framer owns the inline `transform` for the
          // entrance spring, and a Tailwind transform utility would fight it.
          <m.div
            key={step.number}
            variants={card}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-[translate,border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.07] md:hover:[translate:0_-4px] [data-theme=light]:border-black/10 [data-theme=light]:bg-white [data-theme=light]:shadow-sm [data-theme=light]:hover:border-black/20 [data-theme=light]:hover:bg-zinc-50"
          >
            <span className="font-display text-sm font-bold text-zinc-600 [data-theme=light]:text-zinc-400">
              {step.number}
            </span>

            <div className="mt-4 mb-5">
              <GlassIconBadge icon={step.icon} size="lg" />
            </div>

            <h3 className="font-display text-xl font-semibold tracking-tight text-zinc-50 [data-theme=light]:text-zinc-900">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400 [data-theme=light]:text-zinc-500">{step.body}</p>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
