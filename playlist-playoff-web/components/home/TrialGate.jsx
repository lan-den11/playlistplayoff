'use client';

import { m } from 'framer-motion';
import { Music2 } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

// The screen shown once the homepage's 4-song mini bracket crowns a
// champion, for visitors who aren't unlocked yet. Kept deliberately small —
// this sits inside the same compact matchup card the game was just played
// in, it's an invite to join, not a whole new page.
export default function TrialGate({ championTrack }) {
  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="flex h-full flex-col items-center justify-center gap-5 px-2 py-2 text-center"
    >
      {championTrack ? (
        <div className="flex w-full max-w-xs items-center gap-4 text-left">
          {championTrack.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={championTrack.image}
              alt=""
              className="h-16 w-16 flex-none rounded-2xl object-cover ring-2 ring-brand-light/60"
            />
          ) : (
            <div className="flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-white/10">
              <Music2 className="h-6 w-6 text-zinc-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-300">Your champion</p>
            <p className="truncate font-display text-lg font-bold leading-tight text-zinc-50">{championTrack.name}</p>
            <p className="truncate text-sm text-zinc-400">{championTrack.artists}</p>
          </div>
        </div>
      ) : (
        <h3 className="font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      )}

      <WaitlistForm source="trial_gate" gradient="brand" label="Join waitlist" className="mt-1" />
    </m.div>
  );
}
