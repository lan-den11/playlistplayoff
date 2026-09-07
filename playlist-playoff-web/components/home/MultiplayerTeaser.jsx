'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bell, Check } from 'lucide-react';
import GlassButton from '../ui/GlassButton';

export default function MultiplayerTeaser() {
  const [notified, setNotified] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-16 text-center backdrop-blur-md sm:px-14"
      >
        {/* Gold glow ties this "premium/coming soon" section to the same
            accent used for the champion moment — one consistent meaning for
            gold across the app, instead of a one-off hue. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/15 blur-[100px]"
        />

        <div className="relative mx-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-semibold text-amber-300">
          <Sparkles className="h-3.5 w-3.5" />
          Coming soon
        </div>

        <h2 className="relative mt-6 font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
          Play with friends.
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-zinc-400">
          Private rooms, async voting, and a running leaderboard for your group —
          plus Quick Round, a lightweight weekly pick-a-theme game for when a
          full bracket's too much.
        </p>

        <div className="relative mt-9 flex justify-center">
          <AnimatePresence mode="wait" initial={false}>
            {notified ? (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300"
              >
                <Check className="h-4 w-4" />
                You're on the list
              </motion.div>
            ) : (
              <motion.div key="cta" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassButton onClick={() => setNotified(true)}>
                  <Bell className="h-4 w-4" />
                  Get notified
                </GlassButton>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </section>
  );
}
