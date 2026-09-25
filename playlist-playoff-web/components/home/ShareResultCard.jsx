'use client';

import { useState } from 'react';
import { Loader2, Share2, Trophy } from 'lucide-react';
import { SITE_HOST } from '../../lib/site';
import { captureClientException, captureEvent } from '../../lib/posthog-client';
import GlassButton from '../ui/GlassButton';

// Off-screen card html2canvas captures into a shareable image, plus the
// "Share" button that drives it. Redesigned as a full 1080x1920 portrait
// (the ratio every story/reel format wants) using the same dark
// glass-and-brand-gradient language as the rest of the site, instead of the
// old flat 1080x1080 list: the champion leads at the top, the two
// semifinals that got them there sit underneath, and the footer calls out
// the site itself — see items #13-15.
//
// `mainBracketRounds` is the trial's own small bracket (semifinal round,
// then the final) — see hooks/useBracket.js. Round 0 = the two semifinal
// matches; the last round's single match's winner is the champion.
function MatchRow({ match }) {
  if (!match?.a || !match?.b) return null;
  const winner = match.winner;
  const loser = winner && winner.id === match.a.id ? match.b : match.a;
  if (!winner || !loser) return null;

  return (
    <div className="flex items-center gap-5 rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <TrackChip track={winner} won size={104} />
      <span className="font-display text-2xl font-bold text-zinc-600">vs</span>
      <TrackChip track={loser} won={false} size={104} />
    </div>
  );
}

function TrackChip({ track, won, size }) {
  return (
    <div className={`flex min-w-0 flex-1 items-center gap-4 ${won ? '' : 'opacity-55'}`}>
      {track.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={track.image}
          crossOrigin="anonymous"
          alt=""
          style={{ width: size, height: size }}
          className={`flex-none rounded-2xl object-cover ${won ? 'ring-2 ring-brand-light/70' : ''}`}
        />
      ) : (
        <div style={{ width: size, height: size }} className="flex-none rounded-2xl bg-white/10" />
      )}
      <div className="min-w-0">
        {won && <p className="mb-1 text-[20px] font-bold uppercase tracking-widest text-brand-light">Winner</p>}
        <p className="truncate font-display text-[28px] font-bold leading-tight text-zinc-50">{track.name}</p>
        <p className="truncate text-[20px] text-zinc-400">{track.artists}</p>
      </div>
    </div>
  );
}

function SharePortraitCard({ championTrack, mainBracketRounds, cardRef }) {
  const semis = mainBracketRounds?.[0] || [];
  const final = mainBracketRounds?.[mainBracketRounds.length - 1]?.[0];
  const runnerUp = final && final.winner && final.a && final.b ? (final.winner.id === final.a.id ? final.b : final.a) : null;

  return (
    <div
      ref={cardRef}
      className="fixed left-[-9999px] top-0 flex h-[1920px] w-[1080px] flex-col bg-zinc-950 px-16 py-20 font-sans text-zinc-50"
      style={{
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(18,64,234,0.28) 0%, rgba(9,9,11,0) 45%), radial-gradient(circle at 100% 20%, rgba(245,158,11,0.16) 0%, rgba(9,9,11,0) 40%)',
      }}
    >
      {/* Wordmark */}
      <div className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/25"
          style={{ backgroundImage: 'linear-gradient(180deg, rgba(124,156,255,0.55) 0%, rgba(10,26,107,0.55) 100%)' }}
        >
          <Trophy className="h-8 w-8 text-zinc-50" />
        </div>
        <p className="font-display text-4xl font-bold tracking-tight">Playlist Playoff</p>
      </div>

      {/* Champion */}
      <div className="mt-14 flex flex-col items-center rounded-[40px] border border-brand/40 bg-white/[0.06] p-12 text-center">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-6 py-2.5 text-[22px] font-bold uppercase tracking-widest text-amber-300">
          <Trophy className="h-6 w-6" />
          Champion
        </p>
        {championTrack?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={championTrack.image}
            crossOrigin="anonymous"
            alt=""
            className="h-[420px] w-[420px] rounded-[32px] object-cover shadow-2xl shadow-black/60 ring-4 ring-brand-light/60"
          />
        ) : (
          <div className="flex h-[420px] w-[420px] items-center justify-center rounded-[32px] bg-white/10">
            <Trophy className="h-24 w-24 text-zinc-500" />
          </div>
        )}
        <p className="mt-8 max-w-full truncate font-display text-[56px] font-bold leading-tight tracking-tight">
          {championTrack?.name}
        </p>
        <p className="mt-2 truncate text-[30px] text-zinc-400">{championTrack?.artists}</p>
      </div>

      {/* How they got there */}
      <div className="mt-14 flex-1">
        <p className="mb-5 text-center text-[22px] font-bold uppercase tracking-widest text-zinc-500">
          How they got there
        </p>
        <div className="space-y-5">
          {semis.map((m, i) => (
            <MatchRow key={i} match={m} />
          ))}
          {runnerUp && (
            <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <TrackChip track={runnerUp} won={false} size={104} />
            </div>
          )}
        </div>
      </div>

      {/* Footer / website CTA */}
      <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/10 pt-10 text-center">
        <p className="font-display text-[30px] font-bold">Build your own bracket free</p>
        <p className="text-[26px] font-semibold text-brand-light">{SITE_HOST}</p>
      </div>
    </div>
  );
}

export default function ShareResultCard({ championTrack, mainBracketRounds, cardRef }) {
  const [status, setStatus] = useState('idle'); // idle | working | done | error

  const caption = `I crowned "${championTrack.name}" the champion of my mini bracket on Playlist Playoff 🏆 Try it yourself at ${SITE_HOST}`;

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
        const file = new File([blob], 'playlist-playoff-champion.png', { type: 'image/png' });

        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({ files: [file], title: 'Playlist Playoff', text: caption });
            captureEvent('trial_result_shared', { method: 'native_share' });
            setStatus('done');
            return;
          } catch (err) {
            if (err?.name === 'AbortError') {
              setStatus('idle');
              return;
            }
          }
        }

        try {
          await navigator.clipboard.writeText(caption);
        } catch {
          // clipboard blocked — the download still gives them something to post
        }
        const link = document.createElement('a');
        link.download = 'playlist-playoff-champion.png';
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
        Share your champion
      </GlassButton>
      {status === 'done' && (
        <p className="mt-2 text-xs text-zinc-500">Caption copied + image ready to post!</p>
      )}
      {status === 'error' && (
        <p className="mt-2 text-xs text-rose-400">Couldn't generate the image — try again.</p>
      )}

      <SharePortraitCard championTrack={championTrack} mainBracketRounds={mainBracketRounds} cardRef={cardRef} />
    </>
  );
}
