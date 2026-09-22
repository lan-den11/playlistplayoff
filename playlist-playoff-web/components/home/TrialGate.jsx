'use client';

import { m } from 'framer-motion';
import { Trophy } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import WaitlistForm from './WaitlistForm';

// What replaces the hero trial once its picks are used up. It is a normal
// child of the matchup card — the game (embeds, buttons, state) is unmounted
// to make room for it, not covered by it — so there is nothing for browser
// devtools to peel away. `minHeight` matches the game's last height so the
// card doesn't jump.
export default function TrialGate({ minHeight }) {
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
      <h3 className="mt-5 font-display text-xl font-bold tracking-tight text-zinc-50">Thanks for playing!</h3>
      <p className="mt-2 max-w-xs text-sm text-zinc-400">
        More coming soon! Join the waitlist to be notified as soon as full brackets release.
      </p>
      <WaitlistForm source="trial_gate" gradient="brand" label="Join waitlist" className="mt-6" />
    </m.div>
  );
}
