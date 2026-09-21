'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import FitToScreen from '../ui/FitToScreen';
import HeroMatchup from './HeroMatchup';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

// The hero + matchup card must fit on the first screen at any viewport size
// (FitToScreen scales them down if the natural layout is taller than the
// space available). That space is one small-viewport screen minus everything
// that isn't the hero content:
//   - the site header, ONLY when it's rendered (`showNavbar`): its fixed h-20
//     row (80px) + 1px border = 81px (components/ui/SiteHeader.jsx). With the
//     header off, that whole strip goes to the hero, so it scales down less
//     — i.e. renders bigger — on small screens.
//   - this section's own padding: top is `pt-4` (16px) with the header, `pt-6`
//     (24px) without it (nothing above the hero to breathe against). Bottom is
//     always `pb-14` (56px), deliberately larger — it's where the "Scroll to
//     see more" hint sits, so the hint can never overlap the card on a tight
//     screen.
// Keep these numbers in sync with SiteHeader and the section's padding classes.
const NAVBAR_HEIGHT_PX = 81;
const PADDING_TOP_WITH_NAVBAR_PX = 16;
const PADDING_TOP_NO_NAVBAR_PX = 24;
const PADDING_BOTTOM_PX = 56;

export default function Hero({ trendingPlaylistId, accessMode = 'hero-only', showNavbar = true }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const [showScrollHint, setShowScrollHint] = useState(true);

  const reservedPx =
    (showNavbar ? NAVBAR_HEIGHT_PX + PADDING_TOP_WITH_NAVBAR_PX : PADDING_TOP_NO_NAVBAR_PX) + PADDING_BOTTOM_PX;

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
    <section className={`relative px-6 pb-14 md:px-8 ${showNavbar ? 'pt-4' : 'pt-6'}`}>
      <FitToScreen reserve={reservedPx}>
        {/* grid-cols-1 (= minmax(0, 1fr)) instead of the implicit `auto` column:
            an auto column is at least as wide as its widest unbreakable child,
            so a long track title (nowrap + truncate) in the matchup card
            stretched the whole column past the viewport on narrow phones —
            the sideways scroll. minmax(0, …) lets `truncate` do its job.
            Headline steps down a size at each breakpoint so the longest word
            ("showdown.") always fits its column instead of spilling into the
            card's. */}
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-16">
          <motion.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
            <motion.h1
              variants={item}
              className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]"
            >
              Turn any playlist into a showdown.
            </motion.h1>

            <motion.p
              variants={item}
              className="mx-auto mt-3 max-w-lg text-sm text-zinc-400 sm:text-base md:mx-0 md:mt-5 md:text-lg"
            >
              Select winners per matchup until one song takes the crown while listening history influences your choices.
            </motion.p>

            <motion.div variants={item} className="mt-5 flex justify-center md:mt-8 md:justify-start">
              <GradientButton gradient="brand" onClick={() => router.push(isOpen ? '/bracket' : '/waitlist')}>
                {isOpen ? 'Start a bracket' : 'Join the waitlist'}
                <ArrowRight className="h-4 w-4" />
              </GradientButton>
            </motion.div>
          </motion.div>

          <HeroMatchup trendingPlaylistId={trendingPlaylistId} accessMode={accessMode} />
        </div>
      </FitToScreen>

      {/* Fixed to the viewport (not this section) so its position never
          depends on how tall the hero's own content grows. Sits inside the
          section's 56px bottom padding (12–52px from the bottom). */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showScrollHint ? 1 : 0 }}
        transition={{ delay: showScrollHint ? 1 : 0, duration: 0.6 }}
        className="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center md:bottom-4"
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
