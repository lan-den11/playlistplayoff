'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { Music2, Share, Check } from 'lucide-react';
import { encodeBracket } from '../../lib/shareBracket';
import { captureEvent } from '../../lib/posthog-client';
import WaitlistForm from './WaitlistForm';

export default function TrialGate({ championTrack, mainBracketRounds }) {
  const [copied, setCopied] = useState(false);

  const championImage = championTrack?.imageLarge || championTrack?.image;

  async function handleShare() {
    const code = encodeBracket(mainBracketRounds);
    const url =
      typeof window === 'undefined' ? '' : code ? `${window.location.origin}/share?b=${code}` : window.location.href;
    const text = championTrack
      ? `I crowned "${championTrack.name}" by ${championTrack.artists} as my champion!`
      : 'Check out my music bracket result!';

    const shareData = { title: 'Playlist Playoff Champion', text, url };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare?.(shareData)) {
      captureEvent('trial_share_clicked', { method: 'native' });
      try {
        await navigator.share(shareData);
      } catch {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      captureEvent('trial_share_clicked', { method: 'clipboard' });
      await navigator.clipboard.writeText(`${text} ${url}`);
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
      className="flex h-full flex-col items-center justify-center gap-5 px-2 py-2 text-center"
    >
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
          <div className="min-w-0 max-w-full">
            <p className="truncate font-display text-xl font-bold leading-tight text-zinc-50 sm:text-2xl">
              {championTrack.name}
            </p>
            <p className="truncate text-sm text-zinc-400">{championTrack.artists}</p>
          </div>

          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-zinc-50 transition-colors hover:bg-white/10 active:scale-95"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share className="h-3.5 w-3.5" />}
            {copied ? 'Link Copied!' : 'Share Result'}
          </button>
        </div>
      ) : (
        <h3 className="font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      )}

      <span aria-hidden="true" className="h-px w-16 bg-white/10" />

      <div className="flex max-w-sm flex-col gap-1.5">
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
