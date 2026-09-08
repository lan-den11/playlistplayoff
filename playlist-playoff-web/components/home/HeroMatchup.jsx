'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Flame, Loader2, Music2 } from 'lucide-react';
import { useBracket, TRENDING_HANDOFF_STORAGE_KEY } from '../../hooks/useBracket';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { TRENDING_PLAYLIST_ID } from '../../lib/spotifyAuth';
import EmbedPanel from '../bracket/EmbedPanel';

// After this many real picks, the teaser hands off to the full-screen
// bracket at /bracket. Assumes TEASER_BRACKET_SIZE songs with no wildcard —
// an 8-song single-elimination bracket always has 7 real matches, so 5
// always lands mid-bracket, well before a champion is crowned. This only
// holds because Spotify's Top 50 Global playlist reliably has 50 tracks;
// if that source ever shrank below 6 songs the math would need revisiting.
const PICKS_BEFORE_HANDOFF = 5;
const TEASER_BRACKET_SIZE = 8;

function StaticFallback() {
  // Shown only if the live Spotify fetch fails entirely (e.g. missing
  // credentials) — a non-interactive placeholder so the homepage never
  // looks broken to a visitor.
  return (
    <div className="relative mx-auto w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-md shadow-2xl shadow-black/40">
      <p className="mb-4 text-center text-xs font-semibold uppercase tracking-widest text-zinc-500">Round of 8</p>
      <div className="flex items-start gap-3">
        <div className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500">
            <Music2 className="h-6 w-6 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Night Drive</p>
          <p className="truncate text-xs text-zinc-400">Nocturn</p>
        </div>
        <span className="mt-8 flex-none font-display text-sm font-bold text-zinc-600">VS</span>
        <div className="flex flex-1 flex-col items-center gap-2.5 rounded-2xl border border-teal-400/30 bg-teal-500/10 p-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600">
            <Music2 className="h-6 w-6 text-zinc-950" />
          </div>
          <p className="truncate text-sm font-semibold text-zinc-50">Golden Hour</p>
          <p className="truncate text-xs text-zinc-400">Marlowe</p>
        </div>
      </div>
    </div>
  );
}

function TeaserSide({ side, track, elRef, loading, gradient, onPick, isAnimatingPick }) {
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
      <EmbedPanel elRef={elRef} loading={loading} gradient={gradient} />
      <div className="w-full text-center">
        <p className="truncate font-display text-sm font-semibold text-zinc-50">{track?.name}</p>
        <p className="truncate text-xs text-zinc-400">{track?.artists}</p>
      </div>
      <motion.button
        type="button"
        onClick={() => onPick(side)}
        disabled={Boolean(isAnimatingPick)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`w-full rounded-full bg-gradient-to-r ${gradient} px-4 py-2.5 text-xs font-semibold text-zinc-950 disabled:opacity-60`}
      >
        Choose Song
      </motion.button>
    </motion.div>
  );
}

/**
 * The homepage's live, playable teaser. This runs a real 8-song bracket
 * through the exact same engine (useBracket) and the exact same Spotify
 * embed component (EmbedPanel / useSpotifyEmbed) as the full /bracket
 * experience — same audio, same "Choose Song" mechanic, same visual
 * language — instead of a static, click-only mockup with album art and no
 * sound. It's a taste of the real thing, not an ad for it.
 */
export default function HeroMatchup() {
  const router = useRouter();
  // Its own isolated save slot (see hooks/useBracket.js) so this teaser can
  // never overwrite a real in-progress bracket someone already has saved
  // from pasting their own playlist.
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

  // Same fixed 550ms "loading" delay BattleScreen uses, reset per matchup.
  // Just like BattleScreen, the embeds' host <div>s below (inside
  // EmbedPanel) are never remounted across matchups — only re-targeted via
  // loadUri(). That symmetry is deliberate: it's the fix for the "only the
  // first song ever plays" bug, and it has to hold here too or this teaser
  // would have the exact same bug all over again.
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
        <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
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
        <Flame className="h-3.5 w-3.5 text-violet-400" />
        Trending on Spotify · {bracket.roundLabel}
      </p>

      <div className="flex items-start gap-3">
        <TeaserSide
          side="a"
          track={pendingA}
          elRef={embedA.elRef}
          loading={embedLoadingA}
          gradient="from-violet-500 to-indigo-500"
          onPick={handlePick}
          isAnimatingPick={isAnimatingPick}
        />
        <span className="mt-20 flex-none font-display text-sm font-bold text-zinc-600">VS</span>
        <TeaserSide
          side="b"
          track={pendingB}
          elRef={embedB.elRef}
          loading={embedLoadingB}
          gradient="from-teal-400 to-cyan-600"
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
