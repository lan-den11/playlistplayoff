'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { ChevronDown, Music2, UserCircle, ListMusic, CreditCard } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import Glow from '../ui/Glow';

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
    a: "Yes — a free tier will cover standard-sized solo brackets. Premium unlocks larger solo brackets plus extra benefits for our multiplayer features, coming soon. Join the waitlist now and you'll get a free week of Premium plus a Founding Member badge the day we launch.",
  },
];

function FaqItem({ item, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
        isOpen ? 'border-brand/30 bg-brand/5' : 'border-white/10 bg-white/5'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <m.div animate={{ scale: isOpen ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
          <GlassIconBadge icon={item.icon} size="sm" />
        </m.div>
        <span
          className={`flex-1 font-display text-[15px] font-semibold tracking-tight transition-colors duration-300 ${
            isOpen ? 'text-brand-light' : 'text-zinc-50'
          }`}
        >
          {item.q}
        </span>
        <span
          className={`flex-none transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 text-brand-light' : 'text-zinc-500'
          }`}
        >
          <ChevronDown className="h-5 w-5" />
        </span>
      </button>

      <div
        id={panelId}
        role="region"
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-5 pl-[3.75rem] text-[15px] leading-relaxed text-zinc-400">
            {item.a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="relative overflow-x-clip">
      <Glow tone="deep" className="-top-24 left-1/2 h-[22rem] w-[44rem] max-w-full -translate-x-1/2" />

      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8 md:py-20">
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative mb-8 text-center font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:mb-10"
        >
          Your questions, our answers
        </m.h2>

        <m.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="relative space-y-3"
        >
          {FAQS.map((item, i) => (
            <m.div
              key={item.q}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            >
              <FaqItem
                item={item}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
