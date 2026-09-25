'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import FitToScreen from '../ui/FitToScreen';
import HeroMatchup from './HeroMatchup';
import GenreToggle from './GenreToggle';
import { scrollToWaitlist } from '../../lib/scroll';

const HEADLINE_WORDS = 'Turn any playlist into a showdown.'.split(' ');

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

const headline = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const word = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

const NAVBAR_HEIGHT_PX = 57;
const PADDING_TOP_WITH_NAVBAR_PX = 16;
const PADDING_TOP_NO_NAVBAR_PX = 24;
const PADDING_BOTTOM_PX = 56;

const TRENDING_GENRE = { key: 'trending', label: 'Trending', playlistId: null };

export default function Hero({ trendingPlaylistId, genres = [], accessMode = 'hero-only', showNavbar = true }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const [showScrollHint, setShowScrollHint] = useState(true);

  const allGenres = useMemo(
    () => [{ ...TRENDING_GENRE, playlistId: trendingPlaylistId }, ...genres],
    [trendingPlaylistId, genres]
  );
  const [selectedKey, setSelectedKey] = useState('trending');
  const selected = allGenres.find((g) => g.key === selectedKey) ?? allGenres[0];

  const reservedPx =
    (showNavbar ? NAVBAR_HEIGHT_PX + PADDING_TOP_WITH_NAVBAR_PX : PADDING_TOP_NO_NAVBAR_PX) + PADDING_BOTTOM_PX;

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
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-16">
          <m.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
            <m.h1
              variants={headline}
              className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]"
            >
              {HEADLINE_WORDS.map((w, i) => (
                <Fragment key={i}>
                  <m.span variants={word} className="inline-block">
                    {w}
                  </m.span>
                  {i < HEADLINE_WORDS.length - 1 && ' '}
                </Fragment>
              ))}
            </m.h1>

            <m.p
              variants={item}
              className="mx-auto mt-3 max-w-lg text-sm text-zinc-400 sm:text-base md:mx-0 md:mt-5 md:text-lg"
            >
              Select winners per matchup until one song takes the crown while listening history influences your choices.
            </m.p>

            <m.div variants={item} className="mt-5 flex justify-center md:mt-8 md:justify-start">
              <GradientButton gradient="brand" onClick={() => (isOpen ? router.push('/bracket') : scrollToWaitlist())}>
                {isOpen ? 'Start a bracket' : 'Join the waitlist'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </GradientButton>
            </m.div>
          </m.div>

          {/* flex-col + explicit order (not just DOM order) keeps the genre
              toggle above the trial bracket card at every breakpoint. */}
          <div className="flex flex-col">
            <div className="order-1 w-full">
              <GenreToggle genres={allGenres} selected={selected.key} onSelect={setSelectedKey} />
            </div>
            <div className="order-2 w-full">
              <HeroMatchup trendingPlaylistId={selected.playlistId} accessMode={accessMode} />
            </div>
          </div>
        </div>
      </FitToScreen>

      <AnimatePresence>
        {showScrollHint && (
          <m.div
            key="scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1, duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none fixed inset-x-0 bottom-3 z-10 flex justify-center md:bottom-4"
          >
            <span className="flex animate-nudge flex-col items-center gap-1 text-zinc-500">
              <span className="text-xs">Scroll to see more</span>
              <ChevronDown className="h-4 w-4" />
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
