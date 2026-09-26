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
// to be confused with the homepage trial's TrialGate. "Copy results as text"
// is the only share mechanism (html2canvas was removed site-wide — fragile
// with cross-origin art, formatted awkwardly).
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

  // `imageLarge` is Spotify's biggest album art; `image` (used for
  // thumbnails everywhere else) is deliberately the smallest and looked
  // blocky blown up full-screen here.
  const backgroundImage = championTrack.imageLarge || championTrack.image;

  return (
    <div className="relative overflow-hidden px-4 py-14 text-center sm:px-6 sm:py-20 md:px-8">
      <Confetti />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center opacity-20 blur-3xl"
        style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="relative mx-auto w-full max-w-lg"
      >
        <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300 sm:mb-6">
          <Trophy className="h-3.5 w-3.5" />
          We have a champion
        </div>

        <div className="mb-5 sm:mb-6">
          <EmbedPanel elRef={embed.elRef} loading={!embed.loaded} gradient="from-brand to-brand-light" height={embed.height} />
        </div>

        <div className="mx-auto max-w-sm px-2">
          <h2 className="font-display text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
            {championTrack.name}
          </h2>
          <p className="mt-1.5 truncate text-sm text-zinc-400 sm:text-base">{championTrack.artists}</p>
        </div>

        {preview.length > 0 && (
          <div className="mt-7 space-y-3 text-left sm:mt-8">
            {preview.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">{s.label}</p>
                {s.tracks.map((t) => (
                  <div key={t.id} className="flex items-baseline justify-between gap-3 text-sm text-zinc-300">
                    <span className="min-w-0 truncate">{t.name}</span>
                    <span className="flex-none truncate text-xs text-zinc-500 sm:text-sm">{t.artists}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="mt-7 flex flex-col-reverse items-stretch justify-center gap-3 sm:mt-8 sm:flex-row sm:items-center">
          <GlassButton onClick={handleCopy} className="w-full sm:w-auto">
            <Copy className="h-4 w-4" />
            Copy results as text
          </GlassButton>
          <GradientButton gradient="gold" onClick={onRestart} className="w-full sm:w-auto">
            <RotateCcw className="h-4 w-4" />
            Start a new bracket
          </GradientButton>
        </div>
        {shareStatus && <p className="mt-3 text-xs text-zinc-500">{shareStatus}</p>}
      </motion.div>
    </div>
  );
}
