'use client';

import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useWaitlist } from '@clerk/nextjs';
import { Award, Check, Loader2, Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import { saveWaitlistSignup } from '../../lib/api';
import GradientButton from '../ui/GradientButton';
import GlassIconBadge from '../ui/GlassIconBadge';

// Single email → Clerk waitlist form, shared by every waitlist entry point
// on the site (the homepage "coming soon" section and the hero trial's end
// card) so none of them can drift. `source` tags the PostHog
// waitlist_joined / waitlist_join_failed events and the Supabase signup row.
//
// Both destinations fire from ONE place, right after a successful Clerk
// join — not from a separate effect watching `waitlist.id` — so the
// Supabase copy is never at the mercy of a second render happening in time.
export default function WaitlistForm({
  source,
  gradient = 'gold',
  label = 'Get Notified',
  busyLabel = 'Joining…',
  className = '',
}) {
  const { waitlist, errors, fetchStatus } = useWaitlist();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');

  const joined = Boolean(waitlist?.id);
  const isSubmitting = fetchStatus === 'fetching';
  const errorText = localError || errors?.fields?.emailAddress?.longMessage;

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
      captureEvent('waitlist_join_failed', { source });
      console.error('Failed to join waitlist:', error);
      return;
    }
    // Clerk join succeeded — mirror it into our own Supabase-backed table
    // right now, deterministically, instead of waiting on `waitlist.id` to
    // show up in a later render.
    saveWaitlistSignup({ email: value, source });
    captureEvent('waitlist_joined', { source });
  }

  return (
    <div className={`w-full ${className}`}>
      {!joined && (
        <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold text-amber-300 sm:text-base">
          <Sparkles className="h-4 w-4 flex-none sm:h-5 sm:w-5" />
          1 week free trial of Premium
        </p>
      )}

      <div className="flex flex-col items-center">
        <AnimatePresence mode="wait" initial={false}>
          {joined ? (
            <m.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 py-2 pl-2 pr-5 text-sm font-semibold text-emerald-300"
            >
              <GlassIconBadge icon={Check} size="sm" />
              You're on the list — 1 week of Premium is on us
            </m.div>
          ) : (
            <m.form
              key="cta"
              onSubmit={handleSubmit}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-sm items-stretch gap-2"
            >
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                inputMode="email"
                autoComplete="email"
                aria-label="Email address"
                placeholder="you@example.com"
                disabled={isSubmitting}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-brand/50 focus:outline-none disabled:opacity-60"
              />
              <GradientButton type="submit" gradient={gradient} size="sm" disabled={isSubmitting} className="flex-none">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                {isSubmitting ? busyLabel : label}
              </GradientButton>
            </m.form>
          )}
        </AnimatePresence>
      </div>
      {errorText && !joined && <p className="mt-3 text-center text-xs text-rose-400">{errorText}</p>}
    </div>
  );
}
