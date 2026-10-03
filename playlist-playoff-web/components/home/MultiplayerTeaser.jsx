'use client';

import { useMemo } from 'react';
import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import { useReveal } from '../../hooks/useReveal';
import Glow from '../ui/Glow';
import WaitlistForm from './WaitlistForm';

export default function MultiplayerTeaser() {
  const { item, viewport, isMobile } = useReveal({ amount: 0.2 });

  const card = useMemo(() => {
    const show = item.show(0);
    return {
      hidden: item.hidden,
      show: {
        ...show,
        transition: { ...show.transition, delayChildren: 0.15, staggerChildren: isMobile ? 0.07 : 0.12 },
      },
    };
  }, [item, isMobile]);

  return (
    <section id="waitlist" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-14 md:px-8 md:py-20">
      <m.div
        variants={card}
        initial="hidden"
        whileInView="show"
        viewport={viewport}
        onViewportEnter={() => captureEvent('waitlist_section_viewed')}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-10 text-center backdrop-blur-md transition-colors duration-300 hover:border-white/20 sm:px-14 sm:py-12 md:py-14"
      >
        <Glow tone="amber" className="-top-28 left-1/2 h-80 w-[46rem] max-w-[140%] -translate-x-1/2" />
        <Glow tone="brand" className="-bottom-28 right-0 h-72 w-[40rem] max-w-full" />

        <m.div variants={item} className="flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Coming soon
          </span>
        </m.div>

        <m.h2
          variants={item}
          className="mt-6 text-balance font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
        >
          Music taste, revolutionized
        </m.h2>
        <m.p variants={item} className="mx-auto mt-5 max-w-xl text-pretty text-[17px] leading-relaxed text-zinc-400">
          Generate personalized brackets using your listening data, and let PlayoffAI uncover insights about your true music taste.
        </m.p>

        <m.div variants={item} className="mt-9">
          <WaitlistForm source="multiplayer_teaser" gradient="gold" label="Claim My Spot" />
        </m.div>
      </m.div>
    </section>
  );
}
