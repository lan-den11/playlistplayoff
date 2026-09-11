'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import GradientButton from '../ui/GradientButton';
import GhostFibers from '../ui/GhostFibers';
import HeroMatchup from './HeroMatchup';

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } },
};

export default function Hero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-14 md:px-8 md:pb-32 md:pt-28">
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <GhostFibers lineColor="#140E35" glowColor="#3437A0" />
        <div className="absolute inset-0 bg-zinc-950/45" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2 md:gap-16">
        <motion.div variants={container} initial="hidden" animate="show" className="text-center md:text-left">
          <motion.h1
            variants={item}
            className="font-display text-4xl font-bold leading-[1.1] tracking-tight text-zinc-50 sm:text-6xl md:text-7xl"
          >
            Turn any playlist into a showdown.
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-5 max-w-lg text-base text-zinc-400 sm:text-lg md:mx-0">
            Pick winners, song by song, until one track takes the crown — with your
            actual listening history built in, not just a vote.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex justify-center md:justify-start">
            <GradientButton gradient="brand" onClick={() => router.push('/bracket')}>
              Start a bracket
              <ArrowRight className="h-4 w-4" />
            </GradientButton>
          </motion.div>
        </motion.div>

        <HeroMatchup />
      </div>
    </section>
  );
}
