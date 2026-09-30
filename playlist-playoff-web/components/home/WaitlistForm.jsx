'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import { Award, Check, Loader2 } from 'lucide-react';
import { captureEvent } from '../../lib/posthog-client';
import { saveWaitlistSignup } from '../../lib/api';
import { useTurnstile } from '../../hooks/useTurnstile';
import GradientButton from '../ui/GradientButton';
import GlassIconBadge from '../ui/GlassIconBadge';

export default function WaitlistForm({
  source,
  gradient = 'gold',
  label = 'Claim My Spot',
  busyLabel = 'Joining…',
  className = '',
}) {
  const [email, setEmail] = useState('');
  const [joined, setJoined] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const turnstile = useTurnstile();

  async function handleSubmit(e) {
    e.preventDefault();
    const value = email.trim();
    if (!value) {
      setLocalError('Enter an email address first.');
      return;
    }
    setLocalError('');
    setIsSubmitting(true);
    try {
      const turnstileToken = await turnstile.getToken();
      if (turnstile.enabled && !turnstileToken) {
        throw new Error("We couldn't verify you're human. Refresh the page and try again.");
      }
      await saveWaitlistSignup({ email: value, source, turnstileToken });
      setJoined(true);
      captureEvent('waitlist_joined', { source });
    } catch (error) {
      captureEvent('waitlist_join_failed', { source });
      console.error('Failed to join waitlist:', error.message);
      setLocalError(error.message);
    } finally {
      turnstile.reset();
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <div className="flex flex-col items-center w-full">
        <AnimatePresence mode="wait" initial={false}>
          {joined ? (
            <m.div
              key="confirmed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="inline-flex max-w-full items-center gap-2.5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 py-2 pl-2 pr-5 text-left text-sm font-semibold text-emerald-300 sm:rounded-full"
            >
              <GlassIconBadge icon={Check} size="sm" />
              You're on the list! Your 1 free week of Playoff Pro has been claimed.
            </m.div>
          ) : (
            <m.div
              key="cta-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex w-full max-w-md flex-col items-center gap-3"
            >
              <form
                onSubmit={handleSubmit}
                className="relative flex w-full items-center rounded-full border border-white/30 bg-white/10 p-1.5 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/50"
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
                  className="min-w-0 flex-1 bg-transparent px-4 py-1 text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none disabled:opacity-60"
                />
                <GradientButton type="submit" gradient={gradient} size="sm" disabled={isSubmitting} className="flex-none">
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                  {isSubmitting ? busyLabel : label}
                </GradientButton>
              </form>
              <p className="text-center text-xs text-zinc-400">
                No spam. We'll only email you with launch news and updates. By joining, you agree to our{' '}
                <Link href="/privacy" className="underline underline-offset-2 transition-colors hover:text-zinc-200">
                  Privacy Policy
                </Link>
                .
              </p>
              {turnstile.enabled && <div ref={turnstile.containerRef} className="flex justify-center" />}
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {localError && !joined && <p className="mt-3 text-center text-xs text-rose-400">{localError}</p>}
    </div>
  );
}
