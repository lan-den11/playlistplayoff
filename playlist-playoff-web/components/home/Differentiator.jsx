'use client';

import { motion } from 'framer-motion';
import { BarChart3, Music2 } from 'lucide-react';

// "Homecoming" by Kanye West is the example track here — but it was never
// actually released on Spotify's version of Graduation (a long-standing
// Chris Martin/Coldplay clearance gap), so there's no real Spotify album
// art to fetch for it, and a hotlinked "real cover" image can't be
// verified as stable or license-safe from here. This uses the same
// stylized icon treatment the rest of the app already falls back to when
// there's no real art (see HeroMatchup's StaticFallback) rather than
// guessing at an image URL — swap in real art anytime by dropping a file
// in /public and pointing this at it.
function TrackDetailsMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      className="relative mx-auto w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-2xl shadow-black/40"
    >
      <div className="flex items-center gap-3 border-b border-white/10 pb-5">
        <div className="flex h-14 w-14 flex-none items-center justify-center rounded-2xl border border-white/15 bg-gradient-to-br from-amber-500/25 to-brand/25 backdrop-blur-md">
          <Music2 className="h-6 w-6 text-zinc-50" />
        </div>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-tight text-zinc-50">
            Homecoming
          </p>
          <p className="truncate text-sm text-zinc-400">Kanye West</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-medium text-zinc-300">
              <BarChart3 className="h-3.5 w-3.5 text-brand-light" />
              Your plays
            </span>
            <span className="font-display font-bold text-zinc-50">247</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[88%] rounded-full bg-gradient-to-r from-brand to-brand-light" />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-500">Global popularity</span>
            <span className="font-display font-bold text-zinc-500">34</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
            <div className="h-full w-[24%] rounded-full bg-zinc-600" />
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-xl bg-white/5 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-400">
        This one barely charts — but it's your most played track in the bracket!
      </p>
    </motion.div>
  );
}

export default function Differentiator() {
  return (
    <section className="relative overflow-hidden px-6 py-24 md:px-8 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 right-0 h-80 w-[34rem] max-w-full rounded-full bg-brand/10 blur-[120px]"
      />

      {/* mx-auto max-w-7xl was missing here — every sibling section (Hero,
          HowItWorks, MultiplayerTeaser) caps at max-w-7xl and centers, so
          without it this section stretched edge-to-edge on wide screens
          while everything above and below it stayed centered — the exact
          "goofy"/inconsistent layout this brings back in line. */}
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2 md:gap-20">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="text-center md:text-left"
        >
          <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Not just a vote. Your true taste.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-[17px] leading-relaxed text-zinc-400 md:mx-0">
            Link your Last.fm account and every matchup turns personal with your listening data. See what you
            actually listen to, not just what's trending.
          </p>
        </motion.div>

        <TrackDetailsMockup />
      </div>
    </section>
  );
}
