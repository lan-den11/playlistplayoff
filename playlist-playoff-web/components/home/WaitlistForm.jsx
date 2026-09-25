'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useWaitlist } from '@clerk/nextjs';
import { Award, Check, Loader2, Sparkles } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import { registerReferralCode, joinReferral } from '../../lib/api';
import { useReferralCode } from '../../hooks/useReferralCode';
import GradientButton from '../ui/GradientButton';
import GlassIconBadge from '../ui/GlassIconBadge';
import ReferralShare from './ReferralShare';

// Single email → Clerk waitlist form, shared by every waitlist entry point
// on the site (the homepage "coming soon" teaser, the hero trial's end
// card, and the dedicated /waitlist page) so none of them can drift.
// `source` tags the PostHog waitlist_joined / waitlist_join_failed events.
// `referredBy` is the `?ref=CODE` value from the URL, threaded down from
// the server since only the very first page load can see the raw query
// string.
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
  // appears). Registers this visitor's own referral code (so a launch
  // script can look up who to priority-invite — see
  // app/api/referral/register/route.js) and, if they arrived via someone
  // else's link, credits that person's code with one more referral. This is
  // the actual email-tracking + referral-link handoff for every entry point,
  // /waitlist page included.
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
        <p className="mb-3 flex items-center justify-center gap-1.5 text-center text-sm font-bold text-amber-300 sm:text-base">
          <Sparkles className="h-4 w-4 flex-none sm:h-5 sm:w-5" />
          1 week of Premium free + a Founding Member badge
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
              {/* Both pills share the exact same GlassIconBadge circle
                  (size="sm") and padding, so they read as one matched set
                  instead of two differently-sized chips — item #9. */}
              <div className="inline-flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 py-2 pl-2 pr-5 text-sm font-semibold text-emerald-300">
                  <GlassIconBadge icon={Check} size="sm" />
                  You're on the list
                </span>
                <span className="inline-flex items-center gap-2.5 rounded-full border border-amber-400/30 bg-amber-500/10 py-2 pl-2 pr-5 text-sm font-semibold text-amber-300">
                  <GlassIconBadge icon={Award} size="sm" />
                  Founding Member
                </span>
              </div>
              <ReferralShare code={code} source={source} />
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
