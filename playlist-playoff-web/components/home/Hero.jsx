'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Music2, Flame, Loader2 } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { TRENDING_PLAYLIST_ID } from '../../lib/spotifyAuth';

// After this many real picks, the teaser hands off to the full-screen
// bracket at /bracket. Assumes TEASER_BRACKET_SIZE songs with no wildcard —
// an 8-song single-elimination bracket always has 7 real matches, so 5
// always lands mid-bracket, well before a champion is crowned. This only
// holds because Spotify's Top 50 Global playlist reliably has 50 tracks;
// if that source ever shrank below 6 songs the math would need revisiting.
const PICKS_BEFORE_HANDOFF = 5;
const TEASER_BRACKET_SIZE = 8;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

function TeaserCard({ track, side, onPick, disabled, picked }) {
  const isWinner = picked === side;
  const gradient = side === 'a' ? 'from-violet-500 to-indigo-500' : 'from-teal-400 to-cyan-600';

  return (
    <motion.button
      type="button"
      onClick={() => onPick(side)}
      disabled={disabled}
      animate={picked ? { opacity: isWinner ? 1 : 0.35, scale: isWinner ? 1.03 : 0.97 } : { opacity: 1, scale: 1 }}
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="flex w-full flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-md disabled:cursor-default"
    >
      <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-900">
        {track?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={track.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
            <Music2 className="h-8 w-8 text-zinc-950" />
          </div>
        )}
      </div>
      <div className="w-full text-center">
        <p className="truncate font-display text-sm font-semibold text-zinc-50">{track?.name}</p>
        <p className="truncate text-xs text-zinc-400">{track?.artists}</p>
      </div>
      <span className={`mt-1 rounded-full bg-gradient-to-r ${gradient} px-4 py-1.5 text-[11px] font-semibold text-zinc-950`}>
        Choose Song
      </span>
    </motion.button>
  );
}

function StaticFallback() {
  // Shown only if the live Spotify fetch fails entirely (e.g. missing
  // credentials) — a non-interactive placeholder so the homepage never
  // looks broken to a visitor.
  return (
    <div className="relative mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
        Round of 8
      </p>
      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-3">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <Music2 className="h-4 w-4 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Night Drive</p>
          <p className="truncate text-xs text-zinc-400">Nocturn</p>
        </div>
        <span className="font-display text-sm font-bold text-zinc-600">VS</span>
        <div className="flex-1 rounded-2xl border border-teal-400/30 bg-teal-500/10 p-3">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600">
            <Music2 className="h-4 w-4 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Golden Hour</p>
          <p className="truncate text-xs text-zinc-400">Marlowe</p>
        </div>
      </div>
    </div>
  );
}

function InteractiveMatchup() {
  const router = useRouter();
  // Its own isolated save slot (see hooks/useBracket.js) so this teaser can
  // never overwrite a real in-progress bracket someone already has saved
  // from pasting their own playlist.
  const bracket = useBracket({ storageKey: TRENDING_HANDOFF_STORAGE_KEY });
  const autoStartedRef = useRef(false);
  const [handingOff, setHandingOff] = useState(false);
  const [isAnimatingPick, setIsAnimatingPick] = useState(null);

  // Kick off loading the trending playlist once, on mount — the exact same
  // playlist-tracks route a pasted-in playlist would use.
  useEffect(() => {
    bracket.loadPlaylist(TRENDING_PLAYLIST_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The instant tracks are loaded, skip the options screen entirely — this
  // teaser always runs the same fixed 8-song, no-wildcard, shuffled bracket
  // — and jump straight into battling.
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

  // After a handful of real picks, hand off to the full bracket page.
  // useBracket already autosaved every one of those picks under
  // TRENDING_HANDOFF_STORAGE_KEY, so /bracket just needs to know to look
  // there (via the ?from=trending query param) and offer to resume.
  useEffect(() => {
    if (bracket.state.screen !== 'battle') return;
    if (bracket.state.completedRealMatchesOverall < PICKS_BEFORE_HANDOFF) return;
    setHandingOff(true);
    const t = setTimeout(() => router.push('/bracket?from=trending'), 700);
    return () => clearTimeout(t);
  }, [bracket.state.completedRealMatchesOverall, bracket.state.screen, router]);

  function handlePick(side) {
    if (isAnimatingPick || !bracket.pendingA || !bracket.pendingB) return;
    setIsAnimatingPick(side);
    setTimeout(() => {
      bracket.pick(side === 'a' ? bracket.pendingA : bracket.pendingB);
      setIsAnimatingPick(null);
    }, 300);
  }

  if (bracket.state.loadError) return <StaticFallback />;

  if (handingOff) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-md"
      >
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
        <p className="font-display text-sm font-semibold text-zinc-50">Setting up your full bracket…</p>
      </motion.div>
    );
  }

  if (bracket.state.screen !== 'battle' || !bracket.pendingA || !bracket.pendingB) {
    return (
      <div className="mx-auto w-full max-w-sm animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <div className="mx-auto mb-4 h-3 w-32 rounded-full bg-white/10" />
        <div className="flex gap-3">
          <div className="h-40 flex-1 rounded-2xl bg-white/10" />
          <div className="h-40 flex-1 rounded-2xl bg-white/10" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.3 }}
      className="relative mx-auto w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <p className="mb-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <Flame className="h-3.5 w-3.5 text-violet-400" />
        Trending on Spotify · {bracket.roundLabel}
      </p>

      <div className="flex items-start gap-3">
        <TeaserCard
          track={bracket.pendingA}
          side="a"
          onPick={handlePick}
          disabled={Boolean(isAnimatingPick)}
          picked={isAnimatingPick}
        />
        <span className="mt-10 flex-none font-display text-sm font-bold text-zinc-600">VS</span>
        <TeaserCard
          track={bracket.pendingB}
          side="b"
          onPick={handlePick}
          disabled={Boolean(isAnimatingPick)}
          picked={isAnimatingPick}
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Vote {Math.min(bracket.state.completedRealMatchesOverall + 1, PICKS_BEFORE_HANDOFF)}/{PICKS_BEFORE_HANDOFF} to
        jump into the full bracket
      </p>
    </motion.div>
  );
}

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-14 md:px-8 md:pb-32 md:pt-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 right-0 h-[26rem] w-[26rem] rounded-full bg-indigo-500/15 blur-[110px]"
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl"
          >
            Turn any playlist into a showdown.
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-5 max-w-lg text-base text-zinc-400 sm:text-lg md:mx-0">
            Pick winners, song by song, until one track takes the crown — with your
            actual listening history built in, not just a vote.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex justify-center md:justify-start">
            <GradientButton gradient="brand" onClick={() => router.push('/bracket')}>
              Start a bracket
              <ArrowRight className="h-4 w-4" />
            </GradientButton>
          </motion.div>
        </motion.div>

        <InteractiveMatchup />
      </div>
    </section>
  );
}
