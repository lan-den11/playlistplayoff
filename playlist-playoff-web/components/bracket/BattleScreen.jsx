'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Undo2, Coins, Shuffle, Clock, Settings2, ChevronDown } from 'lucide-react';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import EmbedPanel from './EmbedPanel';
import TrackMeta from './TrackMeta';

function SideBackground({ track, side }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed top-0 h-full w-1/2 overflow-hidden ${side === 'a' ? 'left-0' : 'right-0'}`}
    >
      <AnimatePresence>
        {track?.image && (
          <motion.div
            key={track.image}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 scale-110 bg-cover bg-center blur-3xl"
            style={{ backgroundImage: `url(${track.image})` }}
          />
        )}
      </AnimatePresence>
      <div className="absolute inset-0 bg-zinc-950/60" />
    </div>
  );
}

export default function BattleScreen({
  pendingA,
  pendingB,
  roundLabel,
  realMatchIndexThisRound,
  realMatchCountThisRound,
  progressPct,
  canUndo,
  onPick,
  onUndo,
  onShuffleSwap,
  onSkipSwap,
  showDetails,
  onSetShowDetails,
  lastfmData,
  lastfmEnabled,
  usernameOverride,
  onSetUsernameOverride,
}) {
  const embedA = useSpotifyEmbed();
  const embedB = useSpotifyEmbed();

  const [isAnimatingPick, setIsAnimatingPick] = useState(null); // 'a' | 'b' | null
  const [embedLoadingA, setEmbedLoadingA] = useState(true);
  const [embedLoadingB, setEmbedLoadingB] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const [flashText, setFlashText] = useState(null);
  const lastFlashKeyRef = useRef(null);

  const matchKey = pendingA && pendingB ? `${pendingA.id}:${pendingB.id}` : null;

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

  useEffect(() => {
    if (!pendingA || !pendingB) return;
    if (roundLabel === lastFlashKeyRef.current) return;
    lastFlashKeyRef.current = roundLabel;
    setFlashText(roundLabel);
    const t = setTimeout(() => setFlashText(null), 1100);
    return () => clearTimeout(t);
  }, [roundLabel, pendingA, pendingB]);

  useEffect(() => {
    function handleKeydown(e) {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') handlePick('a');
      if (e.key === 'ArrowRight') handlePick('b');
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingA, pendingB, isAnimatingPick]);

  useEffect(() => {
    if (!showScrollHint) return;
    function handleScroll() {
      setShowScrollHint(false);
      window.removeEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll, { once: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showScrollHint]);

  function handlePick(side) {
    if (isAnimatingPick || !pendingA || !pendingB) return;
    setIsAnimatingPick(side);
    setTimeout(() => {
      onPick(side === 'a' ? pendingA : pendingB);
    }, 300);
  }

  const handleCoinflip = () => {
    if (isAnimatingPick) return;
    handlePick(Math.random() < 0.5 ? 'a' : 'b');
  };

  if (!pendingA || !pendingB) return null;

  const controlsDisabled = Boolean(isAnimatingPick);

  return (
    <div className="relative">
      <SideBackground track={pendingA} side="a" />
      <SideBackground track={pendingB} side="b" />

      <AnimatePresence>
        {flashText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm"
          >
            <span className="rounded-3xl border border-white/10 bg-white/5 px-8 py-4 font-display text-2xl font-bold tracking-tight text-zinc-50 backdrop-blur-md sm:text-3xl">
              {flashText}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative mx-auto max-w-6xl px-6 pb-16 pt-10 md:px-8">
        <div className="grid items-start gap-6 md:grid-cols-[1fr_auto_1fr] md:gap-8">
          <motion.div
            animate={
              isAnimatingPick
                ? { opacity: isAnimatingPick === 'a' ? 1 : 0.35, scale: isAnimatingPick === 'a' ? 1.03 : 0.97 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="flex flex-col items-center"
          >
            <EmbedPanel elRef={embedA.elRef} loading={embedLoadingA} gradient="from-violet-500 to-indigo-500" />
            <AnimatePresence mode="wait">
              <motion.div
                key={pendingA.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <TrackMeta track={pendingA} show={showDetails} lastfmEntry={lastfmData[pendingA.id]} lastfmEnabled={lastfmEnabled} />
              </motion.div>
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() => handlePick('a')}
              disabled={controlsDisabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mt-4 w-full max-w-xs rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              Choose Song
            </motion.button>
          </motion.div>

          <div className="order-first flex flex-col items-center gap-3 md:order-none md:w-56">
            <p className="font-display text-sm font-bold uppercase tracking-widest text-zinc-500">{roundLabel}</p>
            <p className="text-xs text-zinc-500">
              Battle {realMatchIndexThisRound} / {realMatchCountThisRound}
            </p>

            <div className="flex items-center gap-1.5">
              <ControlButton icon={Undo2} label="Undo last pick" onClick={onUndo} disabled={controlsDisabled || !canUndo} />
              <ControlButton icon={Coins} label="Coin flip" onClick={handleCoinflip} disabled={controlsDisabled} />
              <ControlButton icon={Shuffle} label="Swap in a different song" onClick={onShuffleSwap} disabled={controlsDisabled} />
              <ControlButton icon={Clock} label="Think about it later" onClick={onSkipSwap} disabled={controlsDisabled} />
              <ControlButton
                icon={Settings2}
                label="Display settings"
                onClick={() => setSettingsOpen((v) => !v)}
                active={settingsOpen}
              />
            </div>

            <span className="font-display text-lg font-bold text-zinc-700">VS</span>

            <AnimatePresence>
              {settingsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                  className="w-full overflow-hidden"
                >
                  <div className="w-full space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                    <label className="flex items-center gap-2 text-xs text-zinc-300">
                      <input
                        type="checkbox"
                        checked={showDetails}
                        onChange={(e) => onSetShowDetails(e.target.checked)}
                        className="h-3.5 w-3.5 accent-violet-500"
                      />
                      Show track details
                    </label>
                    <div>
                      <label className="mb-1.5 block text-[11px] text-zinc-500">Last.fm username (for play counts)</label>
                      <input
                        type="text"
                        value={usernameOverride}
                        onChange={(e) => onSetUsernameOverride(e.target.value)}
                        placeholder="your Last.fm username"
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            animate={
              isAnimatingPick
                ? { opacity: isAnimatingPick === 'b' ? 1 : 0.35, scale: isAnimatingPick === 'b' ? 1.03 : 0.97 }
                : { opacity: 1, scale: 1 }
            }
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="flex flex-col items-center"
          >
            <EmbedPanel elRef={embedB.elRef} loading={embedLoadingB} gradient="from-teal-400 to-cyan-600" />
            <AnimatePresence mode="wait">
              <motion.div
                key={pendingB.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <TrackMeta track={pendingB} show={showDetails} lastfmEntry={lastfmData[pendingB.id]} lastfmEnabled={lastfmEnabled} />
              </motion.div>
            </AnimatePresence>
            <motion.button
              type="button"
              onClick={() => handlePick('b')}
              disabled={controlsDisabled}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="mt-4 w-full max-w-xs rounded-full bg-gradient-to-r from-teal-400 to-cyan-600 px-6 py-3 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              Choose Song
            </motion.button>
          </motion.div>
        </div>

        <div className="mx-auto mt-14 max-w-md">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-zinc-500">
            Tip: ← / → keys pick · scroll down for the full bracket
          </p>
        </div>

        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6 flex flex-col items-center gap-1 text-zinc-500"
            >
              <span className="text-xs">See the full bracket</span>
              <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
                <ChevronDown className="h-4 w-4" />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ControlButton({ icon: Icon, label, onClick, disabled, active }) {
  return (
    <motion.button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.08 }}
      whileTap={disabled ? undefined : { scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors disabled:opacity-30 ${
        active ? 'border-violet-400/40 bg-violet-500/10 text-violet-300' : 'border-white/10 bg-white/5 text-zinc-400 hover:text-zinc-100'
      }`}
    >
      <Icon className="h-4 w-4" />
    </motion.button>
  );
}
