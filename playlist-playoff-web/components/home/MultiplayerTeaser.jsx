'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWaitlist } from '@clerk/nextjs';
import { Sparkles, Bell, Check, Loader2 } from 'lucide-react';
import GlassButton from '../ui/GlassButton';

export default function MultiplayerTeaser() {
  const { waitlist, errors, fetchStatus } = useWaitlist();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  const joined = Boolean(waitlist?.id);
  const isSubmitting = fetchStatus === 'fetching';
  const fieldError = errors?.fields?.emailAddress?.longMessage;
  const errorText = localError || fieldError;

  async function handleSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setLocalError('Enter an email address first.');
      return;
    }
    setLocalError('');
    const { error } = await waitlist.join({ emailAddress: value });
    if (error) {
      console.error('Failed to join waitlist:', error);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:px-8 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-8 py-16 text-center backdrop-blur-md sm:px-14"
      >
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
            {joined ? (
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
              <motion.form
                key="cta"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex w-full max-w-sm flex-col items-stretch gap-2 sm:flex-row"
              >
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-violet-400/50 focus:outline-none disabled:opacity-60"
                />
                <GlassButton type="submit" className={isSubmitting ? 'pointer-events-none opacity-70' : ''}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                  {isSubmitting ? 'Joining…' : 'Get notified'}
                </GlassButton>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        {errorText && !joined && <p className="relative mt-3 text-xs text-rose-400">{errorText}</p>}
      </motion.div>
    </section>
  );
}
