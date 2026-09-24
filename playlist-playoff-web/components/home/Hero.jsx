'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChevronDown } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import FitToScreen from '../ui/FitToScreen';
import LiveCounter from '../ui/LiveCounter';
import HeroMatchup from './HeroMatchup';
import GenreToggle from './GenreToggle';

const HEADLINE_WORDS = 'Turn any playlist into a showdown.'.split(' ');

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

// The headline is the h1 itself staggering its own words in (a child variant
// set inside the container's orchestration), so it reads as one line landing
// word by word instead of a block fading up.
const headline = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const word = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 18 } },
};

// The hero + matchup card must fit on the first screen at any viewport size
// (FitToScreen scales them down if the natural layout is taller than the
// space available). That space is one small-viewport screen minus everything
// that isn't the hero content:
//   - the site header, ONLY when it's rendered (`showNavbar`): its fixed h-14
//     row (56px) + 1px border = 57px (components/ui/SiteHeader.jsx). With the
//     header off, that whole strip goes to the hero, so it scales down less
//     — i.e. renders bigger — on small screens.
//   - this section's own padding: top is `pt-4` (16px) with the header, `pt-6`
//     (24px) without it (nothing above the hero to breathe against). Bottom is
//     always `pb-14` (56px), deliberately larger — it's where the "Scroll to
//     see more" hint sits, so the hint can never overlap the card on a tight
//     screen.
// Keep these numbers in sync with SiteHeader and the section's padding classes.
const NAVBAR_HEIGHT_PX = 57;
const PADDING_TOP_WITH_NAVBAR_PX = 16;
const PADDING_TOP_NO_NAVBAR_PX = 24;
const PADDING_BOTTOM_PX = 56;

const TRENDING_GENRE = { key: 'trending', label: 'Trending', playlistId: null };

export default function Hero({
  trendingPlaylistId,
  genres = [],
  accessMode = 'hero-only',
  showNavbar = true,
  referredBy = null,
}) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Trending always leads the list and always uses the resolved trending
  // playlist (flag payload, or the hardcoded fallback — see app/page.jsx);
  // any genre tabs after it come from PostHog flags and only appear once
  // configured (see lib/posthog-server.js `getGenrePlaylists`).
  const allGenres = useMemo(
    () => [{ ...TRENDING_GENRE, playlistId: trendingPlaylistId }, ...genres],
    [trendingPlaylistId, genres]
  );
  const [selectedKey, setSelectedKey] = useState('trending');
  const selected = allGenres.find((g) => g.key === selectedKey) ?? allGenres[0];

  const reservedPx =
    (showNavbar ? NAVBAR_HEIGHT_PX + PADDING_TOP_WITH_NAVBAR_PX : PADDING_TOP_NO_NAVBAR_PX) + PADDING_BOTTOM_PX;

  // The hint is pinned to the viewport (not this section) so it always sits
  // in the same spot however tall the hero's content grows, and it goes away
  // for good — unmounted, so its bounce stops running — once the visitor has
  // scrolled past it.
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
          <m.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
            <m.h1
              variants={headline}
              className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-zinc-50 [data-theme=light]:text-zinc-900 sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]"
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
              className="mx-auto mt-3 max-w-lg text-sm text-zinc-400 [data-theme=light]:text-zinc-500 sm:text-base md:mx-0 md:mt-5 md:text-lg"
            >
              Select winners per matchup until one song takes the crown while listening history influences your choices.
            </m.p>

            <m.div variants={item} className="mt-5 flex justify-center md:mt-8 md:justify-start">
              <GradientButton gradient="brand" onClick={() => router.push(isOpen ? '/bracket' : '/waitlist')}>
                {isOpen ? 'Start a bracket' : 'Join the waitlist'}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </GradientButton>
            </m.div>

            <m.div variants={item} className="mt-4 flex justify-center md:justify-start">
              <LiveCounter />
            </m.div>
          </m.div>

          <div>
            <GenreToggle genres={allGenres} selected={selected.key} onSelect={setSelectedKey} />
            <HeroMatchup
              key={selected.playlistId}
              trendingPlaylistId={selected.playlistId}
              accessMode={accessMode}
              referredBy={referredBy}
            />
          </div>
        </div>
      </FitToScreen>

      {/* Fixed to the viewport (not this section) so its position never
          depends on how tall the hero's own content grows. Sits inside the
          section's 56px bottom padding (12–52px from the bottom). */}
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
