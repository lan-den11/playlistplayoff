'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Copy, RotateCcw } from 'lucide-react';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { computeStandings, buildResultsText } from '../../lib/bracketEngine';
import { captureClientException, captureEvent } from '../../lib/posthog-client';
import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';
import EmbedPanel from './EmbedPanel';

const CONFETTI_COLORS = ['#3437A0', '#7B7DC1', '#f5b759', '#fafafa'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        duration: 1.2 + Math.random() * 1,
        delay: Math.random() * 0.4,
      })),
    []
  );

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ top: '-5%', opacity: 1, rotate: 0 }}
          animate={{ top: '105%', opacity: 0, rotate: 360 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          style={{ left: `${p.left}%`, backgroundColor: p.color }}
          className="absolute h-2.5 w-1.5 rounded-sm"
        />
      ))}
    </div>
  );
}

// Full bracket champion screen (real, signed-in brackets via /bracket) — not
// to be confused with the homepage trial's TrialGate. The share-as-image
// feature (html2canvas) has been removed site-wide: it was fragile
// (cross-origin album art could block capture) and the resulting image
// formatted awkwardly. "Copy results as text" is simpler and always works.
export default function ChampionScreen({ championTrack, mainBracketRounds, onRestart }) {
  const embed = useSpotifyEmbed();
  const [shareStatus, setShareStatus] = useState('');

  const standings = useMemo(() => computeStandings(mainBracketRounds), [mainBracketRounds]);
  const preview = standings.filter((s) => s.label !== 'Champion' && s.roundSize <= 8);

  useEffect(() => {
    if (embed.ready && championTrack) embed.loadUri(championTrack.uri);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embed.ready, championTrack]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildResultsText(standings));
      setShareStatus('Copied to clipboard!');
      captureEvent('results_copied', { standing_group_count: standings.length });
    } catch (error) {
      setShareStatus('Could not copy — clipboard permission blocked?');
      captureClientException(error, { flow: 'results_copy' });
    }
  }

  if (!championTrack) return null;

  return (
    <div className="relative overflow-hidden px-6 py-20 text-center md:px-8">
      <Confetti />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-3xl"
        style={{ backgroundImage: championTrack.image ? `url(${championTrack.image})` : undefined }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative mx-auto max-w-lg"
      >
        <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
          <Trophy className="h-3.5 w-3.5" />
          We have a champion
        </div>

        <div className="mb-6">
          <EmbedPanel elRef={embed.elRef} loading={!embed.loaded} gradient="from-brand to-brand-light" height={embed.height} />
        </div>

        <h2 className="font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          {championTrack.name} — {championTrack.artists}
        </h2>

        {preview.length > 0 && (
          <div className="mt-8 space-y-4 text-left">
            {preview.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">{s.label}</p>
                {s.tracks.map((t) => (
                  <div key={t.id} className="flex justify-between text-sm text-zinc-300">
                    <span className="truncate">{t.name}</span>
                    <span className="ml-2 flex-none text-zinc-500">{t.artists}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <GlassButton onClick={handleCopy}>
            <Copy className="h-4 w-4" />
            Copy results as text
          </GlassButton>
        </div>
        {shareStatus && <p className="mt-3 text-xs text-zinc-500">{shareStatus}</p>}

        <div className="mt-8">
          <GradientButton gradient="gold" onClick={onRestart}>
            <RotateCcw className="h-4 w-4" />
            Start a new bracket
          </GradientButton>
        </div>
      </motion.div>
    </div>
  );
}
