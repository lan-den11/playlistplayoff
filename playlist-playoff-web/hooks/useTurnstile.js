'use client';

import { useCallback, useEffect, useRef } from 'react';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAFKhvemkWbseY2rX';
const TOKEN_WAIT_MS = 10000;
const PRELOAD_MARGIN = '600px 0px';

export const TURNSTILE_ACTION = 'waitlist';

let scriptPromise = null;

function loadTurnstile() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve(window.turnstile || null);
    script.onerror = () => {
      scriptPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useTurnstile() {
  const containerRef = useRef(null);
  const widgetRef = useRef(null);
  const tokenRef = useRef(null);
  const enabled = Boolean(SITE_KEY);

  useEffect(() => {
    const node = containerRef.current;
    if (!enabled || !node) return;
    let cancelled = false;
    let observer = null;

    const mount = () => {
      loadTurnstile().then((turnstile) => {
        if (cancelled || !turnstile || widgetRef.current !== null) return;
        widgetRef.current = turnstile.render(node, {
          sitekey: SITE_KEY,
          action: TURNSTILE_ACTION,
          theme: 'dark',
          appearance: 'interaction-only',
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (token) => {
            tokenRef.current = token;
          },
          'expired-callback': () => {
            tokenRef.current = null;
          },
          'error-callback': () => {
            tokenRef.current = null;
          },
        });
      });
    };

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          mount();
        },
        { rootMargin: PRELOAD_MARGIN }
      );
      observer.observe(node);
    } else {
      mount();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      if (widgetRef.current !== null) {
        try {
          window.turnstile?.remove(widgetRef.current);
        } catch {}
        widgetRef.current = null;
      }
      tokenRef.current = null;
    };
  }, [enabled]);

  const getToken = useCallback(async () => {
    if (!enabled) return null;
    const deadline = Date.now() + TOKEN_WAIT_MS;
    while (!tokenRef.current && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return tokenRef.current;
  }, [enabled]);

  const reset = useCallback(() => {
    tokenRef.current = null;
    if (widgetRef.current !== null) {
      try {
        window.turnstile?.reset(widgetRef.current);
      } catch {}
    }
  }, []);

  return { containerRef, getToken, reset, enabled };
}
