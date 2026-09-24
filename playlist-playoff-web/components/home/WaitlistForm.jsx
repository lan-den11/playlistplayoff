'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useWaitlist } from '@clerk/nextjs';
import { Award, Bell, Check, Loader2 } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import { registerReferralCode, joinReferral } from '../../lib/api';
import { useReferralCode } from '../../hooks/useReferralCode';
import GradientButton from '../ui/GradientButton';
import ReferralShare from './ReferralShare';

// Single email → Clerk waitlist form, shared by the "coming soon" teaser and
// the hero trial's end card so the two can't drift. `source` tags the
// PostHog waitlist_joined / waitlist_join_failed events. `referredBy` is the
// `?ref=CODE` value from the URL, threaded down from the server (app/page.jsx)
// since only the very first page load can see the raw query string.
export default function WaitlistForm({
  source,
  gradient = 'gold',
  label = 'Get Notified',
  busyLabel = 'Joining…',
  referredBy = null,
  className = '',
}) {
  const { waitlist, errors, fetchStatus } = useWaitlist();
  const [email, setEmail] = useState('');
  const [localError, setLocalError] = useState('');
  const { code, referredBy: resolvedReferredBy } = useReferralCode(referredBy);

  const joined = Boolean(waitlist?.id);
  const isSubmitting = fetchStatus === 'fetching';
  const errorText = localError || errors?.fields?.emailAddress?.longMessage;

  // Fires once, right when the join is actually confirmed (waitlist.id
  // appears) — not inline after `await waitlist.join()`, since Clerk's hook
  // state may not have flushed the new entry into `waitlist` within that
  // same tick. Registers this visitor's own referral code (so a launch
  // script can look up who to priority-invite — see
  // app/api/referral/register/route.js) and, if they arrived via someone
  // else's link, credits that person's code with one more referral.
  useEffect(() => {
    if (!joined || !waitlist?.id || !code) return;
    registerReferralCode({ code, email, waitlistEntryId: waitlist.id });
    if (resolvedReferredBy && resolvedReferredBy !== code) joinReferral(resolvedReferredBy);
    captureEvent('waitlist_joined', { source, referred_by: resolvedReferredBy || null, founding_member: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the join itself (or the code it needs) actually becomes available
  }, [joined, waitlist?.id, code]);

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
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {!joined && (
        <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-medium text-amber-300 [data-theme=light]:text-amber-600">
          <Award className="h-3.5 w-3.5" />
          Founding members get a badge + 1 week of Premium free at launch
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
              className="flex flex-col items-center gap-2.5"
            >
              <div className="inline-flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 [data-theme=light]:bg-emerald-50 [data-theme=light]:text-emerald-700">
                  <Check className="h-4 w-4" />
                  You're on the list
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 [data-theme=light]:bg-amber-50 [data-theme=light]:text-amber-700">
                  <Award className="h-3.5 w-3.5" />
                  Founding Member
                </span>
              </div>
              <ReferralShare code={code} source={source} />
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
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-50 placeholder:text-zinc-500 focus:border-brand/50 focus:outline-none disabled:opacity-60 [data-theme=light]:border-black/10 [data-theme=light]:bg-black/5 [data-theme=light]:text-zinc-900"
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
