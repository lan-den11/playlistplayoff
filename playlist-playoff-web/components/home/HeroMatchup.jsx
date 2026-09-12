'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Music2 } from 'lucide-react';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { TRENDING_PLAYLIST_ID } from '../../lib/spotifyAuth';
import GradientButton from '../ui/GradientButton';
import EmbedPanel from '../bracket/EmbedPanel';

const PICKS_BEFORE_HANDOFF = 2;
const TEASER_BRACKET_SIZE = 8;

function StaticFallback() {
  // Shown only if the live Spotify fetch fails entirely (e.g. missing
  // credentials, an invalid/expired token, or a network error) — a
  // non-interactive placeholder so the homepage never looks fully broken to
  // a visitor. See the console.error below this component for exactly why
  // it's showing in any given case — this card itself never explains why.
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Round of 8</p>
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-brand/30 bg-brand/10 p-4 backdrop-blur-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur-md">
            <Music2 className="h-6 w-6 text-brand-light" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Night Drive</p>
          <p className="truncate text-xs text-zinc-400">Nocturn</p>
        </div>
        <span className="mt-8 flex-none font-display text-sm font-bold text-zinc-600">VS</span>
        <div className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-sky-400/30 bg-sky-500/10 p-4 backdrop-blur-md">
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

function TeaserSide({ side, track, elRef, loading, embedGradient, accent, onPick, isAnimatingPick }) {
  const isWinner = isAnimatingPick === side;

  return (
    <motion.div
      animate={
        isAnimatingPick
          ? { opacity: isWinner ? 1 : 0.35, scale: isWinner ? 1.03 : 0.97 }
          : { opacity: 1, scale: 1 }
      }
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="flex flex-1 flex-col items-center gap-2.5"
    >
      <EmbedPanel elRef={elRef} loading={loading} gradient={embedGradient} />
      <div className="w-full text-center">
        <p className="truncate font-display text-sm font-semibold text-zinc-50">{track?.name}</p>
        <p className="truncate text-xs text-zinc-400">{track?.artists}</p>
      </div>
      <GradientButton
        gradient={accent}
        size="sm"
        onClick={() => onPick(side)}
        disabled={Boolean(isAnimatingPick)}
        className="w-full"
      >
        Choose Song
      </GradientButton>
    </motion.div>
  );
}

/**
 * The homepage's live, playable teaser. Runs a real 8-song bracket through
 * the exact same engine (useBracket) and the exact same Spotify embed
 * component (EmbedPanel / useSpotifyEmbed) as the full /bracket experience.
 *
 * Seeded from Spotify's own "Top 50 - USA" playlist (see lib/spotifyAuth.js)
 * — VERIFIED live against Spotify this round, this ID is correct and current.
 *
 * DIAGNOSTIC ADDED: if you're seeing the static, non-interactive placeholder
 * card here instead of real, playable songs, this component was already
 * built to fall back to that placeholder the moment the trending playlist
 * fails to load for ANY reason. The single most common cause is
 * `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` missing or wrong in this
 * environment's env vars. The `console.error` below surfaces the exact
 * reason the moment it happens.
 */
export default function HeroMatchup() {
  const router = useRouter();
  const bracket = useBracket({ storageKey: TRENDING_HANDOFF_STORAGE_KEY });
  const embedA = useSpotifyEmbed();
  const embedB = useSpotifyEmbed();

  const autoStartedRef = useRef(false);
  const [handingOff, setHandingOff] = useState(false);
  const [isAnimatingPick, setIsAnimatingPick] = useState(null);
  const [embedLoadingA, setEmbedLoadingA] = useState(true);
  const [embedLoadingB, setEmbedLoadingB] = useState(true);

  const { pendingA, pendingB } = bracket;
  const matchKey = pendingA && pendingB ? `${pendingA.id}:${pendingB.id}` : null;

  useEffect(() => {
    bracket.loadPlaylist(TRENDING_PLAYLIST_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // DIAGNOSTIC: surfaces the real reason the live teaser fell back to the
  // static placeholder, instead of failing completely silently. Open the
  // browser console — the exact error from /api/playlist/.../tracks (e.g.
  // "Spotify credentials not configured...") will be right here.
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
    setHandingOff(true);
    const t = setTimeout(() => router.push('/bracket?from=trending'), 700);
    return () => clearTimeout(t);
  }, [bracket.state.completedRealMatchesOverall, bracket.state.screen, router]);

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

  if (bracket.state.screen !== 'battle' || !pendingA || !pendingB) {
    return (
      <div className="mx-auto w-full max-w-lg animate-pulse rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
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
      className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <p className="mb-4 flex items-center justify-center gap-1.5 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">
        <Flame className="h-3.5 w-3.5 text-brand-light" />
        Trending in the US · {bracket.roundLabel}
      </p>

      <div className="flex items-start gap-3">
        <TeaserSide
          side="a"
          track={pendingA}
          elRef={embedA.elRef}
          loading={embedLoadingA}
          embedGradient="from-brand to-brand-light"
          accent="brand"
          onPick={handlePick}
          isAnimatingPick={isAnimatingPick}
        />
        <span className="mt-20 flex-none font-display text-sm font-bold text-zinc-600">VS</span>
        <TeaserSide
          side="b"
          track={pendingB}
          elRef={embedB.elRef}
          loading={embedLoadingB}
          embedGradient="from-sky-400 to-sky-600"
          accent="sideB"
          onPick={handlePick}
          isAnimatingPick={isAnimatingPick}
        />
      </div>

      <p className="mt-4 text-center text-[11px] text-zinc-500">
        Vote {Math.min(bracket.state.completedRealMatchesOverall + 1, PICKS_BEFORE_HANDOFF)}/{PICKS_BEFORE_HANDOFF} to
        jump into the full bracket
      </p>
    </motion.div>
  );
}
