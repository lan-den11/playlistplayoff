'use client';

import { m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Music2, Trophy } from 'lucide-react';
import PageBackground from '../ui/PageBackground';
import SiteHeader from '../ui/SiteHeader';
import GradientButton from '../ui/GradientButton';
import { roundLabelText } from '../../lib/bracketEngine';
import { useReveal } from '../../hooks/useReveal';

function Art({ src, className }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" decoding="async" className={`flex-none object-cover ${className}`} />
  ) : (
    <div className={`flex flex-none items-center justify-center bg-white/10 ${className}`}>
      <Music2 className="h-1/3 w-1/3 text-zinc-500" />
    </div>
  );
}

function PickRow({ winner, loser }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <Art src={winner.image} className="h-11 w-11 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-zinc-50">{winner.name}</p>
        <p className="truncate text-xs text-zinc-400">beat {loser.name}</p>
      </div>
    </li>
  );
}

export default function ShareResult({ rounds }) {
  const router = useRouter();
  const { container, item } = useReveal({ stagger: 0.1 });

  const champion = rounds?.[rounds.length - 1]?.[0]?.winner ?? null;
  const groups = (rounds ?? [])
    .map((matches) => ({
      label: roundLabelText('main', matches.length * 2),
      picks: matches
        .filter((mt) => mt.a && mt.b && mt.winner)
        .map((mt) => ({ winner: mt.winner, loser: mt.winner.id === mt.a.id ? mt.b : mt.a })),
    }))
    .filter((g) => g.picks.length)
    .reverse();

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-zinc-950">
      <PageBackground />
      <SiteHeader />

      <m.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-lg flex-col items-center gap-8 px-6 pb-16 pt-10 text-center md:px-8 md:pt-14"
      >
        {champion ? (
          <>
            <m.div variants={item} className="flex max-w-full flex-col items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                <Trophy className="h-3.5 w-3.5" />
                Champion
              </span>
              <Art
                src={champion.imageLarge || champion.image}
                className="h-40 w-40 rounded-3xl shadow-xl shadow-black/40 ring-2 ring-brand-light/60 sm:h-48 sm:w-48"
              />
              <div className="min-w-0 max-w-full">
                <h1 className="truncate font-display text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
                  {champion.name}
                </h1>
                <p className="truncate text-sm text-zinc-400">{champion.artists}</p>
              </div>
            </m.div>

            <m.div
              variants={item}
              className="w-full rounded-3xl border border-white/10 bg-white/5 p-2 text-left shadow-2xl shadow-black/40 backdrop-blur-md"
            >
              {groups.map((group) => (
                <div key={group.label} className="py-1">
                  <p className="px-3 pb-1 pt-2 font-display text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {group.label}
                  </p>
                  <ul className="divide-y divide-white/5">
                    {group.picks.map((pick) => (
                      <PickRow key={`${pick.winner.id}-${pick.loser.id}`} winner={pick.winner} loser={pick.loser} />
                    ))}
                  </ul>
                </div>
              ))}
            </m.div>
          </>
        ) : (
          <m.h1 variants={item} className="font-display text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
            This bracket link couldn&apos;t be loaded.
          </m.h1>
        )}

        <m.div variants={item}>
          <GradientButton gradient="brand" onClick={() => router.push('/')}>
            Make your own bracket
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </GradientButton>
        </m.div>
      </m.section>
    </main>
  );
}
