'use client';

import { useRef } from 'react';
import { m } from 'framer-motion';
import { Trophy } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import WaitlistForm from './WaitlistForm';
import ShareResultCard from './ShareResultCard';

// What replaces the hero trial once the mini bracket (semifinal x2, final
// x1) has crowned a champion. It is a normal child of the matchup card — the
// game is unmounted to make room for it, not covered by it. `minHeight`
// matches the game's last height so the card doesn't jump.
export default function TrialGate({ minHeight, championTrack, mainBracketRounds, referredBy }) {
  const shareCardRef = useRef(null);

  return (
    <m.div
      initial={{ opacity: 0, scale: 0.96, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      style={minHeight ? { minHeight } : undefined}
      className="flex flex-col items-center justify-center px-2 py-4 text-center"
    >
      <GlassIconBadge icon={Trophy} size="lg" />
      {championTrack ? (
        <>
          <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-amber-300">Your champion</p>
          <h3 className="mt-1 font-display text-xl font-bold tracking-tight text-zinc-50">
            {championTrack.name}
          </h3>
          <p className="text-sm text-zinc-400">{championTrack.artists}</p>
        </>
      ) : (
        <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      )}
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        More coming soon! Join the waitlist to be notified as soon as full brackets release.
      </p>

      {championTrack && mainBracketRounds && (
        <ShareResultCard championTrack={championTrack} mainBracketRounds={mainBracketRounds} cardRef={shareCardRef} />
      )}

      <WaitlistForm source="trial_gate" gradient="brand" label="Join waitlist" referredBy={referredBy} className="mt-6" />
    </m.div>
  );
}
