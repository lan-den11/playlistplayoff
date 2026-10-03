'use client';

import { useState } from 'react';
import { m } from 'framer-motion';
import { ChevronDown, Music2, UserCircle, ListMusic, CreditCard } from 'lucide-react';
import GlassIconBadge from '../ui/GlassIconBadge';
import Glow from '../ui/Glow';
import WordReveal from '../ui/WordReveal';

const FAQS = [
  {
    icon: Music2,
    q: 'Do I need Spotify Premium?',
    a: "No. Playlist Playoff uses Spotify's embeds to give you a free 30-second preview of every song.",
  },
  {
    icon: UserCircle,
    q: 'Do I need an account?',
    a: 'An account is required to link your Last.fm data and save your Spotify username.',
  },
  {
    icon: ListMusic,
    q: 'How can I find playlists?',
    a: 'Any public Spotify or Apple Music playlist works, or use the search function to find playlists by username. We aim to support more music platforms as we grow, and implement a playlist search feature.',
  },
  {
    icon: CreditCard,
    q: 'Will this be free?',
    a: "Yes - the free tier will cover standard-sized solo brackets. Playoff Pro unlocks larger solo brackets plus extra benefits for our multiplayer features, coming soon. Join the waitlist now and you'll get a free week of Playoff Pro the day we launch.",
  },
];

const group = {
  hidden: {},
  show: {},
};

const rise = {
  hidden: { opacity: 0, y: 20 },
  show: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 280, damping: 24, delay: 0.35 + index * 0.1 },
  }),
};

const VIEWPORT = { once: true, amount: 0.25, margin: '0px 0px -60px 0px' };

function FaqItem({ item: faqItem, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;

  return (
    <div
      className={`rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
        isOpen ? 'border-brand/30 bg-brand/5' : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="group flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <m.div animate={{ scale: isOpen ? 1.08 : 1 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }}>
          <GlassIconBadge icon={faqItem.icon} size="sm" />
        </m.div>
        <span className="flex-1 font-display text-[15px] font-semibold tracking-tight text-zinc-50">
          {faqItem.q}
        </span>
        <span
          className={`flex-none transition-all duration-300 ease-out ${
            isOpen ? 'rotate-180 text-brand-light' : 'text-zinc-500 group-hover:text-zinc-300'
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
            {faqItem.a}
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

      <m.div
        variants={group}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="mx-auto max-w-3xl px-6 py-14 md:px-8 md:py-20"
      >
        <WordReveal
          as="h2"
          inherit
          text="Your questions, our answers"
          className="relative mb-8 text-center font-display text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl md:mb-10"
        />

        <div className="relative space-y-3">
          {FAQS.map((faqItem, i) => (
            <m.div key={faqItem.q} variants={rise} custom={i}>
              <FaqItem
                item={faqItem}
                index={i}
                isOpen={openIndex === i}
                onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
              />
            </m.div>
          ))}
        </div>
      </m.div>
    </section>
  );
}
