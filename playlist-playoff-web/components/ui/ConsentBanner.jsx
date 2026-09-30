'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, m } from 'framer-motion';
import { ChevronDown, Cookie } from 'lucide-react';
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

const GLASS =
  'border border-white/20 bg-zinc-950/50 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)]';

const SPRING = { type: 'spring', stiffness: 300, damping: 26 };

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const decide = useCallback((granted) => {
    storeConsent(granted ? 'granted' : 'denied');
    applyAnalytics(granted);
    setVisible(false);
    setExpanded(false);
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

    const reopen = () => {
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, reopen);
    return () => {
      cancelled = true;
      window.removeEventListener(OPEN_CONSENT_EVENT, reopen);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-start px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4">
      <AnimatePresence mode="wait">
        {visible && !expanded && (
          <m.button
            key="pill"
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Open cookie preferences"
            aria-expanded={false}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            className={`pointer-events-auto inline-flex origin-bottom-left items-center gap-2 rounded-full py-1.5 pl-1.5 pr-4 text-xs font-semibold text-zinc-50 ${GLASS}`}
          >
            <GlassIconBadge icon={Cookie} size="sm" />
            Cookies
          </m.button>
        )}

        {visible && expanded && (
          <m.div
            key="card"
            role="dialog"
            aria-label="Cookie preferences"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={SPRING}
            className={`pointer-events-auto max-h-[85svh] w-full max-w-sm origin-bottom-left overflow-y-auto rounded-3xl p-5 ${GLASS}`}
          >
            <div className="flex items-start gap-3">
              <GlassIconBadge icon={Cookie} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-base font-semibold tracking-tight text-zinc-50">Your privacy, your call</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-300">
                  We use cookies and similar storage to understand how Playlist Playoff is used and to improve it. Storage
                  that keeps the site working is always on.{' '}
                  <Link href="/privacy" className="font-medium text-zinc-50 underline underline-offset-2">
                    Privacy Policy
                  </Link>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Minimize cookie preferences"
                className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-zinc-50"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
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
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
