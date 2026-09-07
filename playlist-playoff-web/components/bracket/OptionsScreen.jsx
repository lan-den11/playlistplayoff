'use client';

import { motion } from 'framer-motion';
import { bracketBreakdownText } from '../../lib/bracketEngine';
import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';

const SIZES = [4, 8, 16, 32, 64, 128, 256];

export default function OptionsScreen({
  loadedTracksCount,
  bracketSize,
  doShuffle,
  wildcardEnabled,
  onSetBracketSize,
  onSetShuffle,
  onSetWildcardEnabled,
  onStart,
  onBack,
}) {
  const breakdown = bracketBreakdownText(loadedTracksCount, bracketSize, wildcardEnabled);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg items-center px-6 py-16 md:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-md"
      >
        <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-50">
          {loadedTracksCount} songs loaded
        </h2>

        <div className="mt-6 space-y-4">
          <label className="flex items-center gap-2.5 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={doShuffle}
              onChange={(e) => onSetShuffle(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
            Shuffle seeding
          </label>
          <label className="flex items-center gap-2.5 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={wildcardEnabled}
              onChange={(e) => onSetWildcardEnabled(e.target.checked)}
              className="h-4 w-4 accent-violet-500"
            />
            Enable wildcard qualifying round
          </label>

          <div className="flex items-center justify-between gap-4">
            <label className="text-sm text-zinc-300">Bracket size</label>
            <select
              value={bracketSize}
              onChange={(e) => onSetBracketSize(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 focus:border-violet-400/50 focus:outline-none"
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-zinc-400">{breakdown}</p>

        <div className="mt-8 flex gap-3">
          <GradientButton gradient="brand" onClick={onStart}>
            Start Bracket
          </GradientButton>
          <GlassButton onClick={onBack}>Back</GlassButton>
        </div>
      </motion.div>
    </div>
  );
}
