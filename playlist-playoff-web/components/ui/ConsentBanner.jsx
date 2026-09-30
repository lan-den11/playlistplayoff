'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import { Cookie } from 'lucide-react';
import GradientButton from './GradientButton';
import GlassIconBadge from './GlassIconBadge';
import {
  OPEN_CONSENT_EVENT,
  applyAnalytics,
  clearStoredConsent,
  detectConsentRequired,
  readStoredConsent,
  storeConsent,
} from '../../lib/consent';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  const decide = useCallback((granted) => {
    storeConsent(granted ? 'granted' : 'denied');
    applyAnalytics(granted);
    setVisible(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const mode = new URLSearchParams(window.location.search).get('consent');
    if (mode === 'reset') clearStoredConsent();

    async function resolve() {
      if (mode === 'eu') {
        setVisible(true);
        return;
      }
      if (mode !== 'us') {
        const stored = readStoredConsent();
        if (stored) {
          applyAnalytics(stored === 'granted');
          return;
        }
      }
      const required = mode === 'us' ? false : await detectConsentRequired();
      if (cancelled) return;
      if (required) setVisible(true);
      else applyAnalytics(true);
    }

    resolve();

    const reopen = () => setVisible(true);
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      cancelled = true;
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <m.div
          role="dialog"
          aria-label="Cookie preferences"
          initial={{ opacity: 0, y: 28, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 28, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
        >
          <div className="pointer-events-auto max-h-[85svh] w-full max-w-xl overflow-y-auto rounded-3xl border border-white/10 bg-zinc-900/85 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-6">
            <div className="flex items-start gap-4">
              <GlassIconBadge icon={Cookie} size="sm" className="mt-0.5" />
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold tracking-tight text-zinc-50">Your privacy, your call</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  We use cookies and similar storage to understand how Playlist Playoff is used and to improve it. Storage
                  that keeps the site working is always on.{' '}
                  <Link href="/privacy" className="font-medium text-zinc-50 underline underline-offset-2">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <m.button
                type="button"
                onClick={() => decide(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-50 backdrop-blur-md transition-colors hover:bg-white/10"
              >
                Decline
              </m.button>
              <GradientButton gradient="brand" size="sm" onClick={() => decide(true)} className="w-full sm:w-auto">
                Accept
              </GradientButton>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
