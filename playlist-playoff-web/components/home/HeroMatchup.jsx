'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Music2 } from 'lucide-react';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import GradientButton from '../ui/GradientButton';
import EmbedPanel from '../bracket/EmbedPanel';

const PICKS_BEFORE_HANDOFF = 2;
const TEASER_BRACKET_SIZE = 8;

function MatchupDivider() {
  return (
    <div className="flex items-center gap-3 px-1" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      <span className="flex-none font-display text-sm font-bold uppercase tracking-widest text-zinc-50">vs</span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function StaticFallback() {
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-300">Round of 8</p>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-brand/30 bg-brand/10 p-4 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
            <Music2 className="h-6 w-6 text-brand-light" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Night Drive</p>
          <p className="truncate text-xs text-zinc-400">Nocturn</p>
        </div>
        <MatchupDivider />
        <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
            <Music2 className="h-6 w-6 text-sky-400" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Golden Hour</p>
          <p className="truncate text-xs text-zinc-400">Marlowe</p>
        </div>
      </div>
    </div>
  );
}

// The title/artist row under each embed duplicates what Spotify's own card
// already shows, so below `md` (where the hero stacks and vertical space is
// the constraint) it's dropped to keep the whole matchup on the first screen.
// `track` is null while the playlist is still loading: the row keeps its
// height with a non-breaking space so the card never changes size when the
// real data arrives (FitToScreen would otherwise re-scale the whole hero).
function TeaserSide({ side, track, elRef, loading, height, embedGradient, accent, onPick, isAnimatingPick }) {
  const isWinner = isAnimatingPick === side;

  return (
    <motion.div
      animate={
        isAnimatingPick
          ? { opacity: isWinner ? 1 : 0.35, scale: isWinner ? 1.02 : 0.98 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="flex w-full flex-col items-center gap-2.5"
    >
      <EmbedPanel elRef={elRef} loading={loading} gradient={embedGradient} height={height} />
      <div className="hidden w-full text-center md:block">
        <p className="truncate font-display text-sm font-semibold text-zinc-50">{track?.name ?? '\u00A0'}</p>
        <p className="truncate text-xs text-zinc-400">{track?.artists ?? '\u00A0'}</p>
      </div>
      <GradientButton
        gradient={accent}
        size="sm"
        onClick={() => onPick(side)}
        disabled={Boolean(isAnimatingPick) || !track}
        className="mx-auto w-full max-w-xs"
      >
        Choose Song
      </GradientButton>
    </motion.div>
  );
}

export default function HeroMatchup({ trendingPlaylistId, accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const bracket = useBracket({ storageKey: TRENDING_HANDOFF_STORAGE_KEY });
  const embedA = useSpotifyEmbed();
  const embedB = useSpotifyEmbed();

  const autoStartedRef = useRef(false);
  const [handingOff, setHandingOff] = useState(false);
  const [showWaitlistPrompt, setShowWaitlistPrompt] = useState(false);
  const [isAnimatingPick, setIsAnimatingPick] = useState(null);
  const [embedLoadingA, setEmbedLoadingA] = useState(true);
  const [embedLoadingB, setEmbedLoadingB] = useState(true);

  const { pendingA, pendingB } = bracket;
  const matchKey = pendingA && pendingB ? `${pendingA.id}:${pendingB.id}` : null;
  const ready = Boolean(matchKey);
  const floatControls = useAnimationControls();

  // The card (and both Spotify embeds) mount immediately, so the iframe API
  // and the two iframes load in parallel with the playlist request instead of
  // waiting for it. Once the matchup is known, loadUri() just points the
  // already-warm embeds at the two songs.
  useEffect(() => {
    let cancelled = false;
    floatControls
      .start({
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 260, damping: 22 },
      })
      .then(() => {
        if (cancelled) return;
        floatControls.start({
          y: [0, -6, 0],
          transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        });
      });
    return () => {
      cancelled = true;
    };
  }, [floatControls]);

  useEffect(() => {
    bracket.loadPlaylist(trendingPlaylistId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bracket.loadPlaylist is a stable-enough ref from useBracket(); only re-run if the resolved playlist ID itself changes
  }, [trendingPlaylistId]);

  useEffect(() => {
    if (bracket.state.loadError) {
      console.error(
        '[HeroMatchup] Trending playlist failed to load — falling back to the static, non-interactive preview. Reason:',
        bracket.state.loadError
      );
    }
  }, [bracket.state.loadError]);

  useEffect(() => {
    if (bracket.state.screen === 'options' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      bracket.setBracketSize(TEASER_BRACKET_SIZE);
      bracket.setWildcardEnabled(false);
      bracket.setShuffle(true);
      bracket.startTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket.state.screen]);

  useEffect(() => {
    if (bracket.state.screen !== 'battle') return;
    if (bracket.state.completedRealMatchesOverall < PICKS_BEFORE_HANDOFF) return;

    if (isOpen) {
      setHandingOff(true);
      const t = setTimeout(() => router.push('/bracket?from=trending'), 700);
      return () => clearTimeout(t);
    }
    setShowWaitlistPrompt(true);
  }, [bracket.state.completedRealMatchesOverall, bracket.state.screen, router, isOpen]);

  useEffect(() => {
    if (!pendingA || !pendingB) return;
    setIsAnimatingPick(null);
    setEmbedLoadingA(true);
    setEmbedLoadingB(true);
    const t1 = setTimeout(() => setEmbedLoadingA(false), 550);
    const t2 = setTimeout(() => setEmbedLoadingB(false), 550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [matchKey, pendingA, pendingB]);

  useEffect(() => {
    if (embedA.ready && pendingA) embedA.loadUri(pendingA.uri);
  }, [matchKey, embedA.ready, embedA.loadUri, pendingA]);

  useEffect(() => {
    if (embedB.ready && pendingB) embedB.loadUri(pendingB.uri);
  }, [matchKey, embedB.ready, embedB.loadUri, pendingB]);

  function handlePick(side) {
    if (isAnimatingPick || !pendingA || !pendingB) return;
    setIsAnimatingPick(side);
    setTimeout(() => {
      bracket.pick(side === 'a' ? pendingA : pendingB);
    }, 300);
  }

  if (bracket.state.loadError) return <StaticFallback />;

  if (handingOff) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md"
      >
        <Loader2 className="h-6 w-6 animate-spin text-brand-light" />
        <p className="font-display text-sm font-semibold text-zinc-50">Setting up your full bracket…</p>
      </motion.div>
    );
  }

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <motion.div
        aria-hidden="true"
        className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/30 via-brand/10 to-transparent blur-2xl"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={floatControls}
        className="will-change-transform rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl shadow-black/40 md:p-5"
      >
        <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-300 md:mb-4">
          <Flame className="h-3.5 w-3.5 text-brand-light" />
          {bracket.state.playlistName || 'Trending in the US'} · {ready ? bracket.roundLabel : `Round of ${TEASER_BRACKET_SIZE}`}
        </p>

        <div className="flex flex-col gap-3">
          <TeaserSide
            side="a"
            track={pendingA}
            elRef={embedA.elRef}
            loading={embedLoadingA}
            height={embedA.height}
            embedGradient="from-brand to-brand-light"
            accent="brand"
            onPick={handlePick}
            isAnimatingPick={isAnimatingPick}
          />
          <MatchupDivider />
          <TeaserSide
            side="b"
            track={pendingB}
            elRef={embedB.elRef}
            loading={embedLoadingB}
            height={embedB.height}
            embedGradient="from-sky-400 to-sky-600"
            accent="sideB"
            onPick={handlePick}
            isAnimatingPick={isAnimatingPick}
          />
        </div>
      </motion.div>

      <AnimatePresence>
        {showWaitlistPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWaitlistPrompt(false)}
            className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-zinc-950/80 p-4 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-900/90 p-6 text-center backdrop-blur-xl shadow-2xl"
            >
              <h3 className="font-display text-lg font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
              <p className="mt-2 text-sm text-zinc-400">
                More coming soon! Join the waitlist to be notified as soon as full brackets release.
              </p>
              <div className="mt-6 flex justify-center">
                <GradientButton gradient="brand" onClick={() => router.push('/waitlist')}>
                  Join waitlist
                </GradientButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
