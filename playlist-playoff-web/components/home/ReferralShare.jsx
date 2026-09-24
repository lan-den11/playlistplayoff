'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Users } from 'lucide-react';
import { fetchReferralCount } from '../../lib/api';
import { SITE_URL } from '../../lib/site';
import { captureEvent } from '../../lib/posthog-client';

// Shown once someone has joined the waitlist — their own shareable link,
// plus a live count of friends who've joined through it when a database is
// configured (see app/api/referral/[code]/route.js). Reused wherever
// WaitlistForm's "joined" state appears (the homepage teaser and the trial
// end card), so a signup from either spot gets the same referral push.
export default function ReferralShare({ code, source }) {
  const [count, setCount] = useState(null);
  const [configured, setConfigured] = useState(false);
  const [copied, setCopied] = useState(false);

  const link = code ? `${SITE_URL}/?ref=${code}` : null;

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetchReferralCount(code)
      .then((data) => {
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setCount(data.count);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!link) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      captureEvent('waitlist_referral_link_copied', { source });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — the link is still selectable/visible as text
    }
  }

  return (
    <div className="mt-4 w-full max-w-sm">
      <p className="text-xs text-zinc-500 [data-theme=light]:text-zinc-500">
        Invite friends to move up the list:
      </p>
      <div className="mt-2 flex items-stretch gap-2">
        <div className="min-w-0 flex-1 truncate rounded-full border border-white/10 bg-white/5 px-4 py-2 text-left text-xs text-zinc-300 [data-theme=light]:border-black/10 [data-theme=light]:bg-black/5 [data-theme=light]:text-zinc-700">
          {link}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy referral link"
          className="flex-none rounded-full border border-white/10 bg-white/5 p-2 text-zinc-300 transition-colors hover:bg-white/10 [data-theme=light]:border-black/10 [data-theme=light]:bg-black/5 [data-theme=light]:text-zinc-700 [data-theme=light]:hover:bg-black/10"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      {configured && count !== null && count > 0 && (
        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-brand-light [data-theme=light]:text-brand">
          <Users className="h-3.5 w-3.5" />
          {count} {count === 1 ? 'friend has' : 'friends have'} joined through your link
        </p>
      )}
    </div>
  );
}
