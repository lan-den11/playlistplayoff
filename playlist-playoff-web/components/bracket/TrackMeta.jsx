'use client';

export default function TrackMeta({ track, show, lastfmEntry, lastfmEnabled }) {
  if (!show || !track) return null;

  const added = track.addedAt ? new Date(track.addedAt).toLocaleDateString() : 'unknown';
  const albumBit = track.albumName ? `${track.albumName}${track.releaseYear ? ` (${track.releaseYear})` : ''}` : null;

  let playsText;
  if (!lastfmEntry || lastfmEntry.status !== 'ready') {
    playsText = 'Loading plays…';
  } else if (!lastfmEnabled) {
    playsText = 'Last.fm not configured';
  } else {
    playsText = lastfmEntry.playcount == null ? 'not found on Last.fm' : `${lastfmEntry.playcount} plays`;
  }

  return (
    <div className="mt-3 space-y-1.5 text-center text-xs text-zinc-400">
      {albumBit && <div className="truncate">{albumBit}</div>}
      <div>
        Added: <span className="text-zinc-300">{added}</span> · <span className="text-zinc-300">{playsText}</span>
      </div>
      {lastfmEntry?.tags?.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 pt-1">
          {lastfmEntry.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
