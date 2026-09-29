'use client';

import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import Glow from '../ui/Glow';
import Reveal from '../ui/Reveal';
import WaitlistForm from './WaitlistForm';

export default function MultiplayerTeaser() {
  return (
    <m.section
      id="waitlist"
      onViewportEnter={() => captureEvent('waitlist_section_viewed')}
      viewport={{ once: true, amount: 0.4 }}
      className="mx-auto max-w-7xl scroll-mt-10 px-6 py-14 md:px-8 md:py-20"
    >
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-colors duration-300 hover:border-white/20 px-8 py-12 text-center backdrop-blur-md sm:px-14 md:py-14">
        <Glow tone="amber" className="-top-28 left-1/2 h-80 w-[46rem] max-w-[140%] -translate-x-1/2" />
        <Glow tone="brand" className="-bottom-28 right-0 h-72 w-[40rem] max-w-full" />

        <Reveal
          amount={0.4}
          className="relative mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300"
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          Coming soon
        </Reveal>

        <Reveal
          as="h2"
          amount={0.4}
          delay={0.12}
          className="relative mt-6 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
        >
          Music taste, revolutionized
        </Reveal>
        <Reveal
          as="p"
          amount={0.4}
          delay={0.24}
          className="relative mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400"
        >
          Generate personalized brackets using your listening data, and let PlayoffAI uncover insights about your true music taste.
        </Reveal>

        <Reveal amount={0.4} delay={0.36}>
          <WaitlistForm source="multiplayer_teaser" gradient="gold" label="Claim My Spot" className="relative mt-9" />
        </Reveal>
      </div>
    </m.section>
  );
}
