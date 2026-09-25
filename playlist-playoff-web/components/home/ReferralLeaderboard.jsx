'use client';

import { useEffect, useState } from 'react';
import { Crown } from 'lucide-react';
import { fetchReferralLeaderboard } from '../../lib/api';

const MEDALS = ['🥇', '🥈', '🥉'];

// Top-5 referrers, shown right under a visitor's own referral link so
// inviting friends feels like a race worth joining, not a lonely form.
// Hides itself entirely if the leaderboard has no entries yet or the
// database isn't configured — never shows an empty shell.
export default function ReferralLeaderboard({ className = '' }) {
  const [entries, setEntries] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchReferralLeaderboard()
      .then((data) => {
        if (!cancelled) setEntries(data.configured ? data.entries : []);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!entries || entries.length === 0) return null;

  return (
    <div className={`w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md ${className}`}>
      <p className="mb-3 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-300">
        <Crown className="h-3.5 w-3.5" />
        Top referrers
      </p>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.rank}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-sm"
          >
            <span className="flex min-w-0 items-center gap-2.5">
              <span className="w-6 flex-none text-center text-base">
                {MEDALS[entry.rank - 1] || `#${entry.rank}`}
              </span>
              <span className="truncate font-medium text-zinc-200">{entry.displayName}</span>
            </span>
            <span className="flex-none font-display font-bold text-brand-light">
              {entry.referredCount} {entry.referredCount === 1 ? 'invite' : 'invites'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
