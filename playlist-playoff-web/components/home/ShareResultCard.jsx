'use client';

import { useState } from 'react';
import { Loader2, Share2 } from 'lucide-react';
import { SITE_HOST } from '../../lib/site';
import { captureClientException, captureEvent } from '../../lib/posthog-client';
import GlassButton from '../ui/GlassButton';

// Off-screen card html2canvas captures into a shareable image, plus the
// "Share" button that drives it. Lives inside TrialGate, right where
// someone has just finished their trial pick — the moment they're most
// likely to want to show it off. `winner`/`loser` are track objects
// ({ name, artists, image }).
export default function ShareResultCard({ winner, loser, cardRef }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error

  const caption = `I chose "${winner.name}" over "${loser.name}" on Playlist Playoff 🎧 Try it yourself at ${SITE_HOST}`;

  async function handleShare() {
    setStatus('working');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(cardRef.current, { backgroundColor: '#09090b', useCORS: true });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setStatus('error');
          return;
        }
        const file = new File([blob], 'playlist-playoff-pick.png', { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Playlist Playoff', text: caption });
            captureEvent('trial_result_shared', { method: 'native_share' });
            setStatus('done');
            return;
          } catch (err) {
            if (err?.name === 'AbortError') {
              setStatus('idle'); // the visitor cancelled the share sheet — not an error
              return;
            }
            // any other native-share failure falls through to the fallback below
          }
        }

        try {
          await navigator.clipboard.writeText(caption);
        } catch {
          // clipboard blocked — the download still gives them something to post
        }
        const link = document.createElement('a');
        link.download = 'playlist-playoff-pick.png';
        link.href = URL.createObjectURL(blob);
        link.click();
        captureEvent('trial_result_shared', { method: 'clipboard_download_fallback' });
        setStatus('done');
      }, 'image/png');
    } catch (e) {
      setStatus('error');
      captureClientException(e, { flow: 'trial_result_share' });
    }
  }

  return (
    <>
      <GlassButton onClick={handleShare} className="mt-1">
        {status === 'working' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Share2 className="h-4 w-4" />}
        Share your pick
      </GlassButton>
      {status === 'done' && (
        <p className="mt-2 text-xs text-zinc-500 [data-theme=light]:text-zinc-500">
          Caption copied + image ready to post!
        </p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-rose-400">Couldn't generate the image — try downloading instead.</p>
      )}

      {/* Off-screen capture target — a square card sized for IG/TikTok/X. */}
      <div
        ref={cardRef}
        className="fixed left-[-9999px] top-0 flex h-[1080px] w-[1080px] flex-col justify-between bg-zinc-950 p-16 font-sans text-zinc-50"
      >
        <p className="text-center font-display text-3xl font-bold tracking-tight">🏆 Playlist Playoff</p>

        <div className="flex flex-col items-center gap-8">
          <TrackRow track={winner} won />
          <span className="font-display text-2xl font-bold text-zinc-500">VS</span>
          <TrackRow track={loser} won={false} />
        </div>

        <div className="text-center">
          <p className="font-display text-2xl font-semibold">I chose {winner.name}.</p>
          <p className="mt-3 text-lg text-zinc-500">Try it yourself at {SITE_HOST}</p>
        </div>
      </div>
    </>
  );
}

function TrackRow({ track, won }) {
  return (
    <div
      className={`flex w-full items-center gap-6 rounded-3xl border p-6 ${
        won ? 'border-brand/40 bg-brand/10' : 'border-white/10 bg-white/5 opacity-60'
      }`}
    >
      {track.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.image} crossOrigin="anonymous" alt="" className="h-28 w-28 flex-none rounded-2xl object-cover" />
      ) : (
        <div className="h-28 w-28 flex-none rounded-2xl bg-white/10" />
      )}
      <div className="min-w-0">
        <p className="truncate font-display text-2xl font-bold">{track.name}</p>
        <p className="truncate text-lg text-zinc-400">{track.artists}</p>
      </div>
      {won && <span className="ml-auto flex-none text-4xl">👑</span>}
    </div>
  );
}
