'use client';

import { m } from 'framer-motion';
import { Music2, Trophy } from 'lucide-react';
import WaitlistForm from './WaitlistForm';

// The screen shown once the homepage's 4-song mini bracket crowns a
// champion, for visitors who aren't unlocked yet.
export default function TrialGate({ championTrack }) {
  // `imageLarge` is Spotify's biggest album art (same field ChampionScreen
  // uses for its full-bracket background) — this was falling back to
  // `image`, the deliberately-small thumbnail used everywhere else, which
  // is why the champion art here looked low-res.
  const championImage = championTrack?.imageLarge || championTrack?.image;

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
        </div>
      ) : (
        <h3 className="font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      )}

      {/* Larger + white (was text-xs text-zinc-400) so it reads as the
          headline ask of this screen, with the Premium line below sized
          down to stay clearly secondary to it. */}
      <p className="max-w-sm text-sm font-semibold leading-snug text-zinc-50 sm:text-base">
        Join the waitlist to build full brackets from any playlist.
      </p>

      <WaitlistForm
        source="trial_gate"
        gradient="brand"
        label="Join waitlist"
        className="mt-1"
        compactPremiumText
      />
    </m.div>
  );
}
