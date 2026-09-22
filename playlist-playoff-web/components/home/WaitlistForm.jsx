'use client';

import { useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useWaitlist } from '@clerk/nextjs';
import { Bell, Check, Loader2 } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import GradientButton from '../ui/GradientButton';

// Single email → Clerk waitlist form, shared by the "coming soon" teaser and
// the hero trial's end card so the two can't drift. `source` tags the
// PostHog waitlist_joined / waitlist_join_failed events.
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
    captureEvent('waitlist_joined', { source });
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {joined ? (
            <m.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300"
            >
              <Check className="h-4 w-4" />
              You're on the list
            </m.div>
          ) : (
            // Always a single row. `min-w-0` on the input is what makes it work:
            // flex items default to min-width: auto, which stops them shrinking
            // below their content's width — without it the input refuses to
            // shrink and pushes the button onto a second line. `flex-none` +
            // `size="sm"` keep the button compact, so the input gives way first.
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
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
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
