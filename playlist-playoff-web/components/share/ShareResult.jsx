'use client';

import { m } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight, Crown, Music2 } from 'lucide-react';
import PageBackground from '../ui/PageBackground';
import SiteHeader from '../ui/SiteHeader';
import GradientButton from '../ui/GradientButton';
import ShareBracketTree from './ShareBracketTree';
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

export default function ShareResult({ rounds }) {
  const router = useRouter();
  const { container, item } = useReveal({ stagger: 0.1 });

  const champion = rounds?.[rounds.length - 1]?.[0]?.winner ?? null;

  return (
    <main className="relative isolate min-h-screen overflow-x-hidden bg-zinc-950">
      <PageBackground />
      <SiteHeader />

      <m.section
        variants={container}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pb-16 pt-10 text-center md:px-8 md:pt-14"
      >
        {champion ? (
          <>
            <m.div variants={item} className="flex max-w-full flex-col items-center gap-4">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300">
                <Crown className="h-3.5 w-3.5" />
                Champion
              </span>
              <div className="relative">
                <Art
                  src={champion.imageLarge || champion.image}
                  className="h-40 w-40 rounded-3xl shadow-xl shadow-black/40 ring-2 ring-brand-light/60 sm:h-48 sm:w-48"
                />
                <Crown
                  aria-hidden="true"
                  className="absolute -top-6 left-1/2 h-11 w-11 -translate-x-1/2 -rotate-6 fill-amber-300 text-amber-300 drop-shadow-[0_4px_10px_rgba(245,158,11,0.55)]"
                />
              </div>
              <div className="min-w-0 max-w-full">
                <h1 className="truncate font-display text-2xl font-bold leading-tight tracking-tight text-zinc-50 sm:text-3xl">
                  {champion.name}
                </h1>
                <p className="truncate text-sm text-zinc-400">{champion.artists}</p>
              </div>
            </m.div>

            <m.div
              variants={item}
              className="w-full rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-black/40 backdrop-blur-md md:p-6"
            >
              <ShareBracketTree rounds={rounds} />
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
