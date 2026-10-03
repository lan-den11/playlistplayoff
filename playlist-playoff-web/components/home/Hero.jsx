'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import FitToScreen from '../ui/FitToScreen';
import HeroMatchup from './HeroMatchup';
import GenreToggle from './GenreToggle';
import { useAnimateReady } from '../../hooks/useAnimateReady';
import { scrollToWaitlist } from '../../lib/scroll';
import { captureEvent } from '../../lib/posthog-client';

const HEADLINE_WORDS = 'Turn any playlist into a showdown.'.split(' ');

const container = {
  hidden: {},
  show: {},
};

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 22, delay },
  }),
};

const headline = {
  hidden: {},
  show: { transition: { staggerChildren: 0.065 } },
};

const word = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

const stage = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 240, damping: 24, delay: 0.35 },
  },
};

const NAVBAR_HEIGHT_PX = 57;
const PADDING_TOP_WITH_NAVBAR_PX = 16;
const PADDING_TOP_NO_NAVBAR_PX = 24;
const PADDING_BOTTOM_PX = 56;

const TRENDING_GENRE = { key: 'trending', label: 'Trending', playlistId: null };

export default function Hero({ trendingPlaylistId, genres = [], accessMode = 'hero-only', showNavbar = true }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const ready = useAnimateReady();
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [trialFinished, setTrialFinished] = useState(false);

  const allGenres = useMemo(
    () => [{ ...TRENDING_GENRE, playlistId: trendingPlaylistId }, ...genres],
    [trendingPlaylistId, genres]
  );
  const [selectedKey, setSelectedKey] = useState('trending');
  const selected = allGenres.find((g) => g.key === selectedKey) ?? allGenres[0];

  const reservedPx =
    (showNavbar ? NAVBAR_HEIGHT_PX + PADDING_TOP_WITH_NAVBAR_PX : PADDING_TOP_NO_NAVBAR_PX) + PADDING_BOTTOM_PX;

  function handleCtaClick() {
    captureEvent('cta_clicked', { location: 'hero', action: isOpen ? 'start_bracket' : 'join_waitlist' });
    if (isOpen) router.push('/bracket');
    else scrollToWaitlist();
  }

  useEffect(() => {
    if (!showScrollHint) return;
    function handleScroll() {
      if (window.scrollY > 80) setShowScrollHint(false);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);

  const state = ready ? 'show' : 'hidden';

  return (
    <section className={`relative px-6 pb-10 md:px-8 md:pb-14 ${showNavbar ? 'pt-3 md:pt-4' : 'pt-6'}`}>
      <FitToScreen reserve={reservedPx}>
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-4 md:grid-cols-2 md:gap-16">
          <m.div variants={container} initial="hidden" animate={state} className="text-center md:text-left">
            <m.h1
              variants={headline}
              className="text-balance font-display text-[1.7rem] font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]"
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
              variants={fadeUp}
              custom={0.5}
              className="mx-auto mt-2.5 max-w-lg text-pretty text-[13px] leading-snug text-zinc-400 sm:text-base md:mx-0 md:mt-5 md:text-lg"
            >
              Battle tracks head-to-head until one takes the crown. Connect your listening history to generate personalized matchups.
            </m.p>

            <m.div variants={fadeUp} custom={0.65} className="mt-4 flex justify-center md:mt-8 md:justify-start">
              <GradientButton gradient="brand" onClick={handleCtaClick}>
                {isOpen ? 'Start a bracket' : 'Join the waitlist'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </GradientButton>
            </m.div>
          </m.div>

          <m.div variants={stage} initial="hidden" animate={state} className="flex flex-col">
            <div className="order-1 w-full">
              <GenreToggle genres={allGenres} selected={selected.key} onSelect={setSelectedKey} />
            </div>
            <div className="order-2 w-full">
              <HeroMatchup
                trendingPlaylistId={selected.playlistId}
                accessMode={accessMode}
                onTrialStateChange={setTrialFinished}
              />
            </div>
          </m.div>
        </div>
      </FitToScreen>

      <AnimatePresence>
        {showScrollHint && !trialFinished && (
          <m.div
            key="scroll-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 1.8, duration: 0.6 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-10 flex justify-center md:bottom-[calc(1rem+env(safe-area-inset-bottom))]"
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
