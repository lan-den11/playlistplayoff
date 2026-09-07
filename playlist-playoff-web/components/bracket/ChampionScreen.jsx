'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Copy, Download, RotateCcw } from 'lucide-react';
import { useSpotifyEmbed } from '../../hooks/useSpotifyEmbed';
import { computeStandings, buildResultsText } from '../../lib/bracketEngine';
import GradientButton from '../ui/GradientButton';
import GlassButton from '../ui/GlassButton';

// Confetti stays tied to the app's actual palette (brand violet/indigo,
// champion gold, and white) instead of throwing in extra one-off hues —
// festive without turning into five clashing colors.
const CONFETTI_COLORS = ['#7c3aed', '#6366f1', '#f5b759', '#fafafa'];

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

function ShareCard({ standings, cardRef }) {
  const champ = standings.find((s) => s.label === 'Champion');
  const rest = standings.filter((s) => s.label !== 'Champion');

  return (
    <div
      ref={cardRef}
      className="fixed left-[-9999px] top-0 w-[420px] bg-zinc-950 p-8 font-sans text-zinc-50"
    >
      <p className="mb-6 text-center font-display text-lg font-bold">🏆 Playlist Playoff Results</p>
      {champ && (
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="mb-2 text-2xl">👑</div>
          {champ.tracks[0].image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={champ.tracks[0].image}
              crossOrigin="anonymous"
              alt=""
              className="mx-auto mb-3 h-24 w-24 rounded-xl object-cover"
            />
          )}
          <p className="font-display text-base font-bold">{champ.tracks[0].name}</p>
          <p className="text-sm text-zinc-400">{champ.tracks[0].artists}</p>
        </div>
      )}
      {rest.map((s) => (
        <div key={s.label} className="mb-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">{s.label}</p>
          {s.roundSize > 8 ? (
            <p className="text-sm text-zinc-400">{s.tracks.length} songs eliminated here</p>
          ) : (
            s.tracks.map((t) => (
              <div key={t.id} className="flex justify-between text-sm text-zinc-300">
                <span className="truncate">{t.name}</span>
                <span className="ml-2 flex-none text-zinc-500">{t.artists}</span>
              </div>
            ))
          )}
        </div>
      ))}
      <p className="mt-6 text-center text-xs text-zinc-600">Made with Playlist Playoff</p>
    </div>
  );
}

export default function ChampionScreen({ championTrack, mainBracketRounds, onRestart }) {
  const embed = useSpotifyEmbed();
  const [shareStatus, setShareStatus] = useState('');
  const [cardEl, setCardEl] = useState(null);

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
    } catch {
      setShareStatus('Could not copy — clipboard permission blocked?');
    }
  }

  async function handleDownload() {
    if (!cardEl) return;
    setShareStatus('Generating image…');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardEl, { backgroundColor: '#09090b', useCORS: true });
      const link = document.createElement('a');
      link.download = 'playlist-playoff-results.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setShareStatus('Results image downloaded!');
    } catch {
      setShareStatus('Could not generate image — album art may be blocking cross-origin capture.');
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

        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
          <div ref={embed.elRef} className="min-h-[80px] sm:min-h-[152px]" />
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
          <GlassButton onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download results image
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

      <ShareCard standings={standings} cardRef={setCardEl} />
    </div>
  );
}
