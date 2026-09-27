'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Music2, Trophy, Share, Check } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

// The screen shown once the homepage's 4-song mini bracket crowns a
// champion, for visitors who aren't unlocked yet.
export default function TrialGate({ championTrack }) {
  const [copied, setCopied] = useState(false);

  // `imageLarge` is Spotify's biggest album art (same field ChampionScreen
  // uses for its full-bracket background) — this was falling back to
  // `image`, the deliberately-small thumbnail used everywhere else, which
  // is why the champion art here looked low-res.
  const championImage = championTrack?.imageLarge || championTrack?.image;

  async function handleShare() {
    const text = championTrack
      ? `I crowned "${championTrack.name}" by ${championTrack.artists} as my champion!`
      : 'Check out my music bracket result!';

    const shareData = {
      title: 'Music Bracket Champion',
      text,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User closed native share sheet — safe to ignore
      }
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex h-full flex-col items-center justify-center gap-4 px-2 py-2 text-center"
    >
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
        <Trophy className="h-3.5 w-3.5" />
        Your champion
      </span>

      {championTrack ? (
        <div className="flex flex-col items-center gap-3">
          {championImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={championImage}
              alt=""
              decoding="async"
              className="h-24 w-24 flex-none rounded-2xl object-cover ring-2 ring-brand-light/60 shadow-xl shadow-black/40 sm:h-28 sm:w-28"
            />
          ) : (
            <div className="flex h-24 w-24 flex-none items-center justify-center rounded-2xl bg-white/10 sm:h-28 sm:w-28">
              <Music2 className="h-8 w-8 text-zinc-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
              {championTrack.name}
            </p>
            <p className="truncate text-sm text-zinc-400">{championTrack.artists}</p>
          </div>
          
          <button 
            type="button"
            onClick={handleShare}
            className="mt-1 flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-50 transition-colors hover:bg-white/10 active:scale-95"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share className="h-3.5 w-3.5" />}
            {copied ? 'Link Copied!' : 'Share Result'}
          </button>
        </div>
      ) : (
        <h3 className="font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      )}

      <div className="mt-2 flex max-w-sm flex-col gap-1.5">
        <p className="text-sm font-semibold leading-snug text-zinc-50 sm:text-base">
          Save your result & get early access.
        </p>
        <p className="text-xs text-zinc-400">
          Build full brackets from any playlist. Join the waitlist below to lock in <strong className="font-semibold text-zinc-200">1 week of Premium at launch</strong>.
        </p>
      </div>

      <WaitlistForm
        source="trial_gate"
        gradient="brand"
        label="Claim Early Access"
        className="w-full"
      />
    </m.div>
  );
}