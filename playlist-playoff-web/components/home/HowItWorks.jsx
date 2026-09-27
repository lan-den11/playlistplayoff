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
    body: 'Choose any public playlist to personalize your bracket experience.',
  },
  {
    number: '02',
    icon: Play,
    title: 'Select a winner.',
    body: 'Spotify playback embeds and listening history stats help influence your matchup winner.',
  },
  {
    number: '03',
    icon: Trophy,
    title: 'Crown a champion.',
    body: 'See the complete bracket, share results, and play again with another playlist.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

// Scroll-triggered reveal restored: cards fade/slide in with a gentle
// stagger once the section enters view (`once: true` — never replays
// scrolling back up). Icon badge now sits left with the step number to its
// right on the SAME row (was stacked: number on top, icon below it), so the
// two share one line instead of competing for vertical space above the
// title.
export default function HowItWorks() {
  return (
    <section className="relative overflow-x-clip px-6 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
      <Glow tone="brand" className="-top-28 left-1/2 h-[26rem] w-[56rem] max-w-full -translate-x-1/2" />

      <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          How it works
        </h2>
      </div>

      <m.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"
      >
        {STEPS.map((step) => (
          <m.div
            key={step.number}
            variants={item}
            className="relative rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md transition-[translate,border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.07] md:hover:[translate:0_-4px]"
          >
            <div className="flex items-center justify-between">
              <GlassIconBadge icon={step.icon} size="lg" />
              <span className="font-display text-2xl font-bold text-zinc-300">{step.number}</span>
            </div>

            <h3 className="mt-6 font-display text-xl font-semibold tracking-tight text-zinc-50">
              {step.title}
            </h3>
            <p className="mt-2 text-[15px] leading-relaxed text-zinc-400">{step.body}</p>
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
