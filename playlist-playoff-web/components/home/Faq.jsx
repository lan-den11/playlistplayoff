'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Music2, UserCircle, ListMusic, CreditCard } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';

const FAQS = [
  {
    icon: Music2,
    q: 'Do I need Spotify Premium?',
    a: "No. Playlist Playoff uses Spotify's embeds to give you a free 30-second preview of every song — no Premium required.",
  },
  {
    icon: UserCircle,
    q: 'Do I need an account?',
    a: 'An account is required to link your Last.fm data and save your Spotify username.',
  },
  {
    icon: ListMusic,
    q: 'How can I find playlists?',
    a: 'Any public Spotify playlist works, or use the search function to find playlists by username.',
  },
  {
    icon: CreditCard,
    q: 'Will this be free?',
    a: 'Yes — a free tier will cover standard-sized solo brackets. Premium unlocks larger solo brackets plus extra benefits for our multiplayer features, coming soon.',
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
        <GlassIconBadge icon={item.icon} size="sm" />
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
    <section className="relative overflow-hidden mx-auto max-w-3xl px-6 py-24 md:px-8 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 left-1/2 h-64 w-[32rem] max-w-full -translate-x-1/2 rounded-full bg-brand-deep/40 blur-[110px]"
      />

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="relative mb-12 text-center font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl"
      >
        Your questions, our answers
      </motion.h2>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="relative space-y-3"
      >
        {FAQS.map((item, i) => (
          <motion.div
            key={item.q}
            variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <FaqItem item={item} isOpen={openIndex === i} onToggle={() => setOpenIndex(openIndex === i ? -1 : i)} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
