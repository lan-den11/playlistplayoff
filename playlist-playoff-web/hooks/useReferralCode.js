'use client';

import { useEffect, useState } from 'react';

const CODE_KEY = 'pp-referral-code';
const REFERRED_BY_KEY = 'pp-referred-by';

function makeCode() {
  // Short and URL-friendly; carries no email or other PII.
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

// Generates (once) and persists this visitor's own shareable referral code,
// and remembers whoever referred THEM in via a `?ref=` link so it survives
// the trip through Clerk's waitlist flow. `initialReferredBy` comes from the
// server — the `ref` search param on first load — since reading it
// client-side would need a Suspense boundary the homepage doesn't otherwise
// need (Next.js hands page components their searchParams directly).
export function useReferralCode(initialReferredBy) {
  const [code, setCode] = useState(null);
  const [referredBy, setReferredBy] = useState(null);

  useEffect(() => {
    let ownCode;
    try {
      ownCode = window.localStorage.getItem(CODE_KEY);
      if (!ownCode) {
        ownCode = makeCode();
        window.localStorage.setItem(CODE_KEY, ownCode);
      }
    } catch {
      ownCode = makeCode(); // still works for this page view, just isn't remembered
    }
    setCode(ownCode);

    try {
      if (initialReferredBy) {
        window.sessionStorage.setItem(REFERRED_BY_KEY, initialReferredBy);
        setReferredBy(initialReferredBy);
      } else {
        setReferredBy(window.sessionStorage.getItem(REFERRED_BY_KEY) || null);
      }
    } catch {
      setReferredBy(initialReferredBy || null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-derive when the server-provided ?ref= value itself changes
  }, [initialReferredBy]);

  return { code, referredBy };
}
