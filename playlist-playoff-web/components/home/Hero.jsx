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
    // No local GhostFibers layer here anymore — the ghost-fiber effect now
    // lives in <PageBackground> at the page level, fixed behind the entire
    // homepage instead of scoped to just this section's height.
    <section className="relative px-6 pb-20 pt-14 md:px-8 md:pb-32 md:pt-28">
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
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

      {/* Scroll hint — encourages visitors to keep scrolling past the fold
          rather than bouncing after just the hero. Fades in after the rest
          of the hero has settled, then bounces gently forever. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="mt-14 flex justify-center"
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
