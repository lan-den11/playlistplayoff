'use client';

import { Link2, Play, Trophy } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import Glow from '../ui/Glow';
import Reveal from '../ui/Reveal';

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

export default function HowItWorks() {
  return (
    <section className="relative overflow-x-clip px-6 pb-14 pt-8 md:px-8 md:pb-20 md:pt-12">
      <Glow tone="brand" className="-top-28 left-1/2 h-[26rem] w-[56rem] max-w-full -translate-x-1/2" />

      <Reveal className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
        <h2 className="text-balance font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          How it works
        </h2>
      </Reveal>

      <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3 md:gap-6">
        {STEPS.map((step, i) => (
          <Reveal
            key={step.number}
            delay={i * 0.12}
            className="group relative rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-[translate,border-color,background-color] duration-300 hover:border-white/20 hover:bg-white/[0.07] md:p-8 md:hover:[translate:0_-4px]"
          >
            <div className="flex items-center justify-between">
              <span className="transition-transform duration-300 group-hover:scale-110">
                <GlassIconBadge icon={step.icon} size="lg" />
              </span>
              <span className="font-display text-2xl font-bold text-zinc-300 transition-colors duration-300 group-hover:text-zinc-50">{step.number}</span>
            </div>

            <h3 className="mt-5 font-display text-xl font-semibold tracking-tight text-zinc-50 md:mt-6">
              {step.title}
            </h3>
            <p className="mt-2 text-pretty text-[15px] leading-relaxed text-zinc-400">{step.body}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
