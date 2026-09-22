'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Music2 } from 'lucide-react';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { captureEvent } from '../../lib/posthog-client';
import GradientButton from '../ui/GradientButton';
import Bone from '../ui/Bone';
import EmbedPanel from '../bracket/EmbedPanel';
import TrialGate from './TrialGate';

const PICKS_BEFORE_HANDOFF = 2;
const TEASER_BRACKET_SIZE = 8;
const PICK_ANIMATION_MS = 300;
const SPRING = { type: 'spring', stiffness: 260, damping: 22 };

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
// The row is a fixed h-9 (= text-sm line 20px + text-xs line 16px) in BOTH
// states, so swapping the shimmering bones for the real text never changes
// the card's height (FitToScreen would otherwise re-scale the whole hero).
// `revealed` means "this matchup is fully ready" (tracks known AND both
// embeds finished loading) — the bones, the embed skeleton and the button all
// key off the same flag, so both sides appear together.
function TeaserSide({ side, track, revealed, elRef, height, embedGradient, accent, onPick, isAnimatingPick }) {
  const isWinner = isAnimatingPick === side;

  return (
    <m.div
      animate={
        isAnimatingPick
          ? { opacity: isWinner ? 1 : 0.35, scale: isWinner ? 1.02 : 0.98 }
          : { opacity: 1, scale: 1 }
      }
      transition={SPRING}
      className="flex w-full flex-col items-center gap-2.5"
    >
      <EmbedPanel elRef={elRef} loading={!revealed} gradient={embedGradient} height={height} variant="skeleton" />
      <div className="hidden h-9 w-full text-center md:block">
        {revealed && track ? (
          <m.div
            key={track.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <p className="truncate font-display text-sm font-semibold leading-5 text-zinc-50">{track.name}</p>
            <p className="truncate text-xs leading-4 text-zinc-400">{track.artists}</p>
          </m.div>
        ) : (
          <>
            <div className="flex h-5 items-center justify-center">
              <Bone className="h-3 w-2/5 rounded-full" />
            </div>
            <div className="flex h-4 items-center justify-center">
              <Bone className="h-2.5 w-1/4 rounded-full" />
            </div>
          </>
        )}
      </div>
      <GradientButton
        gradient={accent}
        size="sm"
        onClick={() => onPick(side)}
        disabled={Boolean(isAnimatingPick) || !revealed}
        className="mx-auto w-full max-w-xs"
      >
        Choose Song
      </GradientButton>
    </m.div>
  );
}

export default function HeroMatchup({ trendingPlaylistId, accessMode = 'hero-only' }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  // maxPicks makes the trial's pick limit part of the bracket state machine
  // itself — the reducer refuses picks past it — instead of only a UI overlay.
  const bracket = useBracket({ storageKey: TRENDING_HANDOFF_STORAGE_KEY, maxPicks: PICKS_BEFORE_HANDOFF });
  const embedA = useSpotifyEmbed();
  const embedB = useSpotifyEmbed();

  const autoStartedRef = useRef(false);
  const pickTimerRef = useRef(0);
  const gameRef = useRef(null);
  const gameHeightRef = useRef(0);
  const [isAnimatingPick, setIsAnimatingPick] = useState(null);
  const [introDone, setIntroDone] = useState(false);

  const { pendingA, pendingB } = bracket;
  const matchKey = pendingA && pendingB ? `${pendingA.id}:${pendingB.id}` : null;

  // Derived from the reducer's own counter, so it can't drift from the game.
  const trialDone = bracket.state.completedRealMatchesOverall >= PICKS_BEFORE_HANDOFF;
  const view = trialDone ? (isOpen ? 'handoff' : 'gate') : 'game';

  // A matchup is "revealed" only when the tracks are known AND both embeds
  // report they've finished loading them (see useSpotifyEmbed `loaded`).
  const revealed = Boolean(matchKey) && embedA.loaded && embedB.loaded;

  // The card (and both Spotify embeds) mount immediately, so the iframe API
  // and the two iframes load in parallel with the playlist request instead of
  // waiting for it. Once the matchup is known, loadUri() just points the
  // already-warm embeds at the two songs.
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

  // The trial is a random 8-song sample of the WHOLE playlist (not the most
  // recently added), reshuffled on every page load.
  useEffect(() => {
    if (bracket.state.screen === 'options' && !autoStartedRef.current) {
      autoStartedRef.current = true;
      bracket.startSample(TEASER_BRACKET_SIZE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket.state.screen]);

  useEffect(() => {
    if (!trialDone) return;
    if (!isOpen) {
      captureEvent('trial_gate_shown', { picks: PICKS_BEFORE_HANDOFF });
      return;
    }
    const t = setTimeout(() => router.push('/bracket?from=trending'), 700);
    return () => clearTimeout(t);
  }, [trialDone, isOpen, router]);

  useEffect(() => {
    setIsAnimatingPick(null);
  }, [matchKey]);

  useEffect(() => {
    if (revealed) setIntroDone(true);
  }, [revealed]);

  useEffect(() => {
    if (embedA.ready && pendingA) embedA.loadUri(pendingA.uri);
  }, [matchKey, embedA.ready, embedA.loadUri, pendingA]);

  useEffect(() => {
    if (embedB.ready && pendingB) embedB.loadUri(pendingB.uri);
  }, [matchKey, embedB.ready, embedB.loadUri, pendingB]);

  // Remember the game view's height so the end card can match it exactly.
  useEffect(() => {
    if (view === 'game' && gameRef.current) gameHeightRef.current = gameRef.current.offsetHeight;
  });

  useEffect(() => () => clearTimeout(pickTimerRef.current), []);

  function handlePick(side) {
    if (trialDone || isAnimatingPick || !revealed) return;
    setIsAnimatingPick(side);
    pickTimerRef.current = setTimeout(() => {
      bracket.pick(side === 'a' ? pendingA : pendingB);
    }, PICK_ANIMATION_MS);
  }

  if (bracket.state.loadError) return <StaticFallback />;

  const label = introDone ? `${bracket.state.playlistName || 'Trending in the US'} · ${bracket.roundLabel}` : null;

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden="true"
        className="absolute -inset-3 -z-10 animate-glow-pulse rounded-[2rem] bg-gradient-to-br from-brand/30 via-brand/10 to-transparent blur-2xl"
      />

      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING}
      >
        <div className="animate-float rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl shadow-black/40 md:p-5">
          <AnimatePresence mode="wait" initial={false}>
            {view === 'game' && (
              <m.div key="game" ref={gameRef} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
                <p className="mb-3 flex h-4 items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-300 md:mb-4">
                  <Flame className="h-3.5 w-3.5 flex-none text-brand-light" />
                  {label ? <span className="min-w-0 truncate">{label}</span> : <Bone className="h-2.5 w-36 rounded-full" />}
                </p>

                <div className="flex flex-col gap-3">
                  <TeaserSide
                    side="a"
                    track={pendingA}
                    revealed={revealed}
                    elRef={embedA.elRef}
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
                    revealed={revealed}
                    elRef={embedB.elRef}
                    height={embedB.height}
                    embedGradient="from-sky-400 to-sky-600"
                    accent="sideB"
                    onPick={handlePick}
                    isAnimatingPick={isAnimatingPick}
                  />
                </div>
              </m.div>
            )}

            {view === 'gate' && <TrialGate key="gate" minHeight={gameHeightRef.current} />}

            {view === 'handoff' && (
              <m.div
                key="handoff"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={gameHeightRef.current ? { minHeight: gameHeightRef.current } : undefined}
                className="flex flex-col items-center justify-center gap-3 text-center"
              >
                <Loader2 className="h-6 w-6 animate-spin text-brand-light" />
                <p className="font-display text-sm font-semibold text-zinc-50">Setting up your full bracket…</p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.div>
    </div>
  );
}
