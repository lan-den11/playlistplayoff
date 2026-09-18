'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import HeroMatchup from './HeroMatchup';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

export default function Hero({ trendingPlaylistId, accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';

  return (
    // min-h-screen + flex centering means the hero always fills the fold on
    // every viewport height, so the scroll-hint chevron below — absolutely
    // positioned against this same box — always lands at the true bottom of
    // the fold instead of just trailing wherever the content happens to end
    // (which is what put it at a different spot on every screen size).
    <section className="relative flex min-h-screen flex-col justify-center px-6 py-20 md:px-8">
      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl xl:text-[5.5rem]"
          >
            Turn any playlist into a showdown.
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-5 max-w-lg text-base text-zinc-400 sm:text-lg md:mx-0">
            Select winners per matchup until one song takes the crown while listening history influences your choices.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex justify-center md:justify-start">
            <GradientButton gradient="brand" onClick={() => router.push(isOpen ? '/bracket' : '/waitlist')}>
              {isOpen ? 'Start a bracket' : 'Join the waitlist'}
              <ArrowRight className="h-4 w-4" />
            </GradientButton>
          </motion.div>
        </motion.div>

        <HeroMatchup trendingPlaylistId={trendingPlaylistId} accessMode={accessMode} />
      </div>

      {/* Scroll hint — pinned to the bottom of this section's own box
          (which is never shorter than the viewport) so it sits in the same
          spot on every screen, instead of drifting with content height. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="absolute inset-x-0 bottom-6 flex justify-center md:bottom-10"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-1 text-zinc-500"
        >
          <span className="text-xs">Scroll to see more</span>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </motion.div>
    </section>
  );
}
