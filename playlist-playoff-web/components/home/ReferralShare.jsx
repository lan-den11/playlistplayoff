'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Share2, Users } from 'lucide-react';
import { fetchReferralCount } from '../../lib/api';
import { SITE_URL } from '../../lib/site';
import { captureEvent } from '../../lib/posthog-client';
import ReferralLeaderboard from './ReferralLeaderboard';

// Shown once someone has joined the waitlist — their own shareable link, a
// live count of friends who've joined through it, and the top-5 leaderboard
// (see ReferralLeaderboard.jsx). Reused wherever WaitlistForm's "joined"
// state appears (homepage teasers, the trial end card, and now the
// dedicated /waitlist page too), so a signup from any of them gets the same
// referral push.
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

  async function handleShare() {
    const shareData = { title: 'Playlist Playoff', text: 'Join me on Playlist Playoff!', url: link };
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        captureEvent('waitlist_referral_link_shared', { source, method: 'native_share' });
        return;
      } catch (err) {
        if (err?.name === 'AbortError') return;
      }
    }
    handleCopy();
  }

  return (
    <div className="mt-4 flex w-full max-w-sm flex-col items-center gap-4">
      <div className="w-full">
        <p className="mb-2 text-center text-sm font-semibold text-zinc-300">
          Invite friends to move up the list — and the leaderboard below:
        </p>
        <div className="rounded-2xl border border-brand/30 bg-brand/10 px-4 py-3 text-center text-base font-bold text-zinc-50 sm:text-lg">
          {link}
        </div>
        <div className="mt-2.5 flex items-stretch gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition-colors hover:bg-white/10"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        </div>
        {configured && count !== null && count > 0 && (
          <p className="mt-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-brand-light">
            <Users className="h-3.5 w-3.5" />
            {count} {count === 1 ? 'friend has' : 'friends have'} joined through your link
          </p>
        )}
      </div>

      <ReferralLeaderboard />
    </div>
  );
}
