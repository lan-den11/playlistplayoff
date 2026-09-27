'use client';

import { m } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import Glow from '../ui/Glow';
import WaitlistForm from './WaitlistForm';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 280, damping: 24 } },
};

// Scroll-triggered reveal, matching HowItWorks.jsx / Differentiator.jsx —
// this card was the one homepage section with no entrance animation at all.
export default function MultiplayerTeaser() {
  return (
    <section id="waitlist" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-14 md:px-8 md:py-20">
      <m.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-12 text-center backdrop-blur-md sm:px-14 md:py-14"
      >
        <Glow tone="amber" className="-top-28 left-1/2 h-80 w-[46rem] max-w-[140%] -translate-x-1/2" />
        <Glow tone="brand" className="-bottom-28 right-0 h-72 w-[40rem] max-w-full" />

        <m.div
          variants={item}
          className="relative mx-auto inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300"
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          Coming soon
        </m.div>

        <m.h2 variants={item} className="relative mt-6 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Music taste, revolutionized
        </m.h2>
        <m.p variants={item} className="relative mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400">
          A personalized musical bracket experience complete with your listening data, analyzed by our PlayoffAI to
          surface insights on your taste.
        </m.p>

        <m.div variants={item}>
          <WaitlistForm source="multiplayer_teaser" gradient="gold" label="Get Notified" className="relative mt-9" />
        </m.div>
      </m.div>
    </section>
  );
}
