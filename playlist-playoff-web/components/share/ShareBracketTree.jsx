import { Crown, Music2 } from 'lucide-react';

function Row({ track, isWinner, decided }) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 ${isWinner ? 'bg-brand/25' : ''}`}>
      {track?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={track.image} alt="" decoding="async" loading="lazy" className="h-6 w-6 flex-none rounded-md object-cover" />
      ) : (
        <div className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-white/10">
          <Music2 className="h-3 w-3 text-zinc-500" />
        </div>
      )}
      <span
        className={`min-w-0 flex-1 truncate text-left text-xs ${
          isWinner ? 'font-semibold text-zinc-50' : decided ? 'text-zinc-500' : 'text-zinc-300'
        }`}
      >
        {track ? track.name : 'BYE'}
      </span>
    </div>
  );
}

function MatchCard({ match }) {
  const decided = Boolean(match.winner);
  const won = (track) => Boolean(track && match.winner && match.winner.id === track.id);

  return (
    <div className="my-1.5 w-44 flex-none divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/60">
      <Row track={match.a} isWinner={won(match.a)} decided={decided} />
      <Row track={match.b} isWinner={won(match.b)} decided={decided} />
    </div>
  );
}

function Connector() {
  return (
    <div className="flex w-6 flex-none items-center self-stretch">
      <div className="h-1/2 w-3 rounded-r-md border-y border-r border-white/20" />
      <div className="h-px w-3 bg-white/20" />
    </div>
  );
}

function Node({ rounds, r, i }) {
  const match = rounds[r][i];
  if (r === 0) return <MatchCard match={match} />;

  return (
    <div className="flex items-center">
      <div className="flex flex-col">
        <Node rounds={rounds} r={r - 1} i={i * 2} />
        <Node rounds={rounds} r={r - 1} i={i * 2 + 1} />
      </div>
      <Connector />
      <MatchCard match={match} />
    </div>
  );
}

export default function ShareBracketTree({ rounds }) {
  if (!rounds?.length) return null;

  return (
    <div className="overflow-x-auto pb-1">
      <div className="mx-auto flex w-max items-center px-1 py-1">
        <Node rounds={rounds} r={rounds.length - 1} i={0} />
        <div aria-hidden="true" className="h-px w-4 flex-none bg-white/20" />
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/15">
          <Crown className="h-4 w-4 text-amber-300" />
        </span>
      </div>
    </div>
  );
}
