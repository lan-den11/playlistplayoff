'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Music2, UserCircle, ListMusic, ShieldCheck, CreditCard } from 'lucide-react';

const FAQS = [
  {
    icon: Music2,
    q: 'Do I need Spotify Premium?',
    a: "No. Anyone can play — full-track playback just depends on whether you're logged into Spotify Premium in that browser tab; otherwise you'll hear a 30-second preview.",
  },
  {
    icon: UserCircle,
    q: 'Do I need an account?',
    a: 'No — you can build and play a bracket with just a playlist link. An account lets you connect to Last.fm.',
  },
  {
    icon: ListMusic,
    q: 'What playlists work?',
    a: "Any public Spotify playlist, or search by someone's Spotify username to find playlists on their profile.",
  },
  {
    icon: ShieldCheck,
    q: 'Is my data sold or used for ads?',
    a: 'No.',
  },
  {
    icon: CreditCard,
    q: 'Is this free?',
    a: 'Yes, with a free tier that covers solo brackets and one active room. Premium unlocks bigger brackets, multiple rooms, and persistent leagues.',
  },
];

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/5">
          <item.icon className="h-4 w-4 text-zinc-400" />
        </span>
        <span className="flex-1 font-display text-[15px] font-semibold tracking-tight text-zinc-50">
          {item.q}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="flex-none text-zinc-500"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 pl-[3.75rem] text-[15px] leading-relaxed text-zinc-400">
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="mx-auto max-w-3xl px-6 py-24 md:px-8 md:py-32">
      <h2 className="mb-12 text-center font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
        Questions, answered.
      </h2>

      <div className="space-y-3">
        {FAQS.map((item, i) => (
          <FaqItem
            key={item.q}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}
