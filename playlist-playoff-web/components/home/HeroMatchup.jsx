'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Music2, Trophy } from 'lucide-react';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { captureEvent } from '../../lib/posthog-client';
import GradientButton from '../ui/GradientButton';
import LiveCounter from '../ui/LiveCounter';
import Bone from '../ui/Bone';
import EmbedPanel from '../bracket/EmbedPanel';
import TrialGate from './TrialGate';

const TEASER_BRACKET_SIZE = 4;
const PICK_ANIMATION_MS = 300;
const HANDOFF_REVEAL_MS = 1600;
const SPRING = { type: 'spring', stiffness: 260, damping: 22 };

function MatchupDivider() {
  return (
    <div className="flex items-center gap-3 px-1" aria-hidden="true">
      <span className="h-px flex-1 bg-white/10" />
      <span className="flex-none font-display text-sm font-bold uppercase tracking-widest text-zinc-50">
        vs
      </span>
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

function StaticFallback() {
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-300">
        Semifinal
      </p>
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
            <p className="truncate font-display text-sm font-semibold leading-5 text-zinc-50">
              {track.name}
            </p>
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

function ChampionReveal({ championTrack, elRef, height, loading }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING}
      className="flex flex-col items-center gap-3 text-center"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
        <Trophy className="h-3.5 w-3.5" />
        Your champion
      </span>
      <div className="relative w-full">
        <div className="absolute inset-4 -z-10 animate-pulse rounded-[2rem] bg-brand/40 blur-2xl filter" aria-hidden="true" />
        <EmbedPanel elRef={elRef} loading={loading} gradient="from-brand to-brand-light" height={height} />
      </div>
      {championTrack && (
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-zinc-50">{championTrack.name}</p>
          <p className="truncate text-xs text-zinc-400">{championTrack.artists}</p>

          <m.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-[11px] font-medium text-emerald-400"
          >
            Contrarian pick! Only 8% chose this track.
          </m.p>
        </div>
      )}
    </m.div>
  );
}

export default function HeroMatchup({ trendingPlaylistId, accessMode = 'hero-only', onTrialStateChange }) {
  const router = useRouter();
  const isOpen = accessMode === 'unlocked';
  const bracket = useBracket({ storageKey: TRENDING_HANDOFF_STORAGE_KEY });
  const embedA = useSpotifyEmbed();
  const embedB = useSpotifyEmbed();

  const autoStartedRef = useRef(false);
  const pickTimerRef = useRef(0);
  const contentWrapRef = useRef(null);
  const maxHeightRef = useRef(0);
  const completedRef = useRef(new Map());
  const activeIdRef = useRef(trendingPlaylistId);
  const [restored, setRestored] = useState(null);
  const [lockedHeight, setLockedHeight] = useState(undefined);
  const [isAnimatingPick, setIsAnimatingPick] = useState(null);
  const [introDone, setIntroDone] = useState(false);

  const { pendingA, pendingB } = bracket;
  const matchKey = pendingA && pendingB ? `${pendingA.id}:${pendingB.id}` : null;

  const liveDone = bracket.state.screen === 'champion';
  const trialDone = Boolean(restored) || liveDone;
  const championTrack = restored ? restored.championTrack : bracket.state.championTrack;
  const mainBracketRounds = restored ? restored.mainBracketRounds : bracket.state.mainBracketRounds;
  const playlistName = restored ? restored.playlistName : bracket.state.playlistName;
  const view = trialDone ? (isOpen ? 'handoff' : 'gate') : 'game';

  const revealed = Boolean(matchKey) && embedA.loaded && embedB.loaded;

  useEffect(() => {
    onTrialStateChange?.(view !== 'game');
  }, [view, onTrialStateChange]);

  useEffect(() => {
    activeIdRef.current = trendingPlaylistId;
    setIsAnimatingPick(null);
    const done = completedRef.current.get(trendingPlaylistId);
    if (done) {
      autoStartedRef.current = true;
      setRestored(done);
      return;
    }
    autoStartedRef.current = false;
    setRestored(null);
    bracket.restart();
    bracket.loadPlaylist(trendingPlaylistId);
  }, [trendingPlaylistId]);

  useEffect(() => {
    if (restored || !liveDone || !bracket.state.championTrack) return;
    completedRef.current.set(activeIdRef.current, {
      championTrack: bracket.state.championTrack,
      mainBracketRounds: bracket.state.mainBracketRounds,
      playlistName: bracket.state.playlistName,
    });
  }, [restored, liveDone, bracket.state.championTrack, bracket.state.mainBracketRounds, bracket.state.playlistName]);

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
      bracket.startSample(TEASER_BRACKET_SIZE);
    }
  }, [bracket.state.screen]);

  useEffect(() => {
    if (!trialDone || restored) return;
    if (!isOpen) {
      captureEvent('trial_gate_shown', { bracket_size: TEASER_BRACKET_SIZE });
      return;
    }
    const t = setTimeout(() => router.push('/bracket?from=trending'), HANDOFF_REVEAL_MS);
    return () => clearTimeout(t);
  }, [trialDone, restored, isOpen, router]);

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

  useEffect(() => {
    if (trialDone && championTrack && embedA.ready) {
      embedA.loadUri(championTrack.uri);
    }
  }, [trialDone, championTrack, embedA.ready]);

  useLayoutEffect(() => {
    const el = contentWrapRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      if (h > maxHeightRef.current) {
        maxHeightRef.current = h;
        if (view !== 'game') setLockedHeight(h);
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [view]);

  useEffect(() => {
    if (view !== 'game') setLockedHeight((prev) => Math.max(prev || 0, maxHeightRef.current));
  }, [view]);

  useEffect(() => () => clearTimeout(pickTimerRef.current), []);

  function handlePick(side) {
    if (trialDone || isAnimatingPick || !revealed) return;
    setIsAnimatingPick(side);
    const winner = side === 'a' ? pendingA : pendingB;
    pickTimerRef.current = setTimeout(() => {
      bracket.pick(winner);
    }, PICK_ANIMATION_MS);
  }

  if (bracket.state.loadError && !restored) return <StaticFallback />;

  const label = introDone
    ? `${playlistName || 'Trending in the US'} · ${trialDone ? 'Champion' : bracket.roundLabel}`
    : null;

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div
        aria-hidden="true"
        className="absolute -inset-3 -z-10 rounded-[2rem] bg-gradient-to-br from-brand/30 via-brand/10 to-transparent blur-2xl md:animate-glow-pulse"
      />

      <m.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING}
      >
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-md shadow-2xl shadow-black/40 md:animate-float md:p-5">
          <div className="mb-3 flex min-h-[1.35rem] items-center justify-between gap-2 md:mb-4">
            <p className="flex min-w-0 items-center gap-1.5 text-center font-display text-xs font-bold uppercase tracking-widest text-zinc-300">
              <Flame className="h-3.5 w-3.5 flex-none text-brand-light" />
              {label ? <span className="min-w-0 truncate">{label}</span> : <Bone className="h-2.5 w-36 rounded-full" />}
            </p>
            <LiveCounter compact className="flex-none" />
          </div>

          <div style={view !== 'game' && lockedHeight ? { minHeight: lockedHeight } : undefined}>
            <div ref={contentWrapRef}>
              <AnimatePresence mode="wait" initial={false}>
                {view === 'game' && (
                  <m.div key="game" exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
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

                {view === 'gate' && (
                  <TrialGate
                    key={`gate-${championTrack?.id ?? 'none'}`}
                    championTrack={championTrack}
                    mainBracketRounds={mainBracketRounds}
                  />
                )}

                {view === 'handoff' && (
                  <m.div key="handoff" className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <ChampionReveal
                      championTrack={championTrack}
                      elRef={embedA.elRef}
                      height={embedA.height}
                      loading={!embedA.loaded}
                    />
                    <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-light" />
                      Setting up your full bracket…
                    </p>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </m.div>
    </div>
  );
}
