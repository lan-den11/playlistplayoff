'use client';

import { useEffect, useState } from 'react';
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

// Real height of Navbar's own row: py-4 (32px) + the h-9 (36px) icon badge
// + its 1px border ≈ 69px, rounded up. Hero used to size itself to
// min-h-screen on its own, stacked *below* that navbar in normal flow —
// so navbar height + a full screen of hero always added up to taller than
// one screen, forcing a small scroll before the fold even without any
// content overflowing. Subtracting it here means navbar + hero together
// fill exactly one viewport.
const NAVBAR_HEIGHT_PX = 70;

export default function Hero({ trendingPlaylistId, accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const [showScrollHint, setShowScrollHint] = useState(true);

  // The hint used to be `absolute` inside this section, anchored to the
  // section's own bottom edge. Once HeroMatchup swaps its loading skeleton
  // for the real interactive card (taller, with two live embeds), the
  // section grows to fit that content and drags the hint down with it —
  // "isn't visible until it loads, then jumps" and can land below the
  // fold entirely. Pinning it to the viewport instead means it always sits
  // in the same spot regardless of how tall the hero's content gets, and
  // it only ever disappears once the visitor actually scrolls past it.
  useEffect(() => {
    if (!showScrollHint) return;
    function handleScroll() {
      if (window.scrollY > 80) setShowScrollHint(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);

  return (
    <section
      className="relative flex flex-col justify-center px-6 py-20 md:px-8"
      style={{ minHeight: `calc(100dvh - ${NAVBAR_HEIGHT_PX}px)` }}
    >
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

      {/* Fixed to the viewport (not this section) so its position never
          depends on how tall the hero's own content grows. */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollHint ? 1 : 0 }}
        transition={{ delay: showScrollHint ? 1 : 0, duration: 0.6 }}
        className="pointer-events-none fixed inset-x-0 bottom-6 z-10 flex justify-center md:bottom-10"
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
