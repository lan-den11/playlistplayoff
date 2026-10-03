'use client';

import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import Glow from '../ui/Glow';
import WordReveal from '../ui/WordReveal';
import WaitlistForm from './WaitlistForm';

const card = {
  hidden: { opacity: 0, y: 36, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 300, damping: 26 },
  },
};

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22, delay },
  }),
};

const VIEWPORT = { once: true, amount: 0.3, margin: '0px 0px -60px 0px' };

export default function MultiplayerTeaser() {
  return (
    <m.section
      id="waitlist"
      onViewportEnter={() => captureEvent('waitlist_section_viewed')}
      viewport={{ once: true, amount: 0.4 }}
      className="mx-auto max-w-7xl scroll-mt-10 px-6 py-14 md:px-8 md:py-20"
    >
      <m.div
        variants={card}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 transition-colors duration-300 hover:border-white/20 px-5 py-10 text-center backdrop-blur-md sm:px-14 sm:py-12 md:py-14"
      >
        <Glow tone="amber" className="-top-28 left-1/2 h-80 w-[46rem] max-w-[140%] -translate-x-1/2 md:animate-glow-pulse" />
        <Glow tone="brand" className="-bottom-28 right-0 h-72 w-[40rem] max-w-full" />

        <div className="relative">
          <m.div variants={rise} custom={0.1} className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
              <Sparkles className="h-4 w-4 animate-pulse" />
              Coming soon
            </span>
          </m.div>

          <WordReveal
            as="h2"
            inherit
            delay={0.16}
            text="Music taste, revolutionized"
            className="mt-6 text-balance font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
          />

          <m.p
            variants={rise}
            custom={0.4}
            className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-zinc-400"
          >
            Generate personalized brackets using your listening data, and let PlayoffAI uncover insights about your true music taste.
          </m.p>

          <m.div variants={rise} custom={0.5} className="mt-9">
            <WaitlistForm source="multiplayer_teaser" gradient="gold" label="Claim My Spot" />
          </m.div>
        </div>
      </m.div>
    </m.section>
  );
}
