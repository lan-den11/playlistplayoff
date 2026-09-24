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
    a: "Yes — a free tier will cover standard-sized solo brackets. Premium unlocks larger solo brackets plus extra benefits for our multiplayer features, coming soon. Join the waitlist now and you'll get a Founding Member badge plus a free week of Premium the day we launch.",
  },
];

// The answer panel opens with a CSS grid-rows transition (0fr → 1fr) instead
// of animating `height: auto` from JS: same smooth reveal, no per-frame
// measuring, and it keeps working when the main thread is busy.
function FaqItem({ item, index, isOpen, onToggle }) {
  const panelId = `faq-panel-${index}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md [data-theme=light]:border-black/10 [data-theme=light]:bg-white">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={panelId}
        className="flex w-full items-center gap-4 px-6 py-5 text-left"
      >
        <GlassIconBadge icon={item.icon} size="sm" />
        <span className="flex-1 font-display text-[15px] font-semibold tracking-tight text-zinc-50 [data-theme=light]:text-zinc-900">
          {item.q}
        </span>
        <span
          className={`flex-none text-zinc-500 transition-transform duration-300 ease-out ${isOpen ? 'rotate-180' : ''}`}
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
          <p className="px-6 pb-5 pl-[3.75rem] text-[15px] leading-relaxed text-zinc-400 [data-theme=light]:text-zinc-500">
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
    // The section is full-width and the max-w-3xl column lives on an inner
    // div. Before, the section itself was the narrow column AND had
    // overflow-hidden, so its glow was sliced along the column's top *and*
    // side edges — visible tinted seams. overflow-x-clip + a -z-10 glow lets
    // it fade out naturally (see HowItWorks for the full reasoning).
    <section className="relative overflow-x-clip">
      <Glow tone="deep" className="-top-24 left-1/2 h-[22rem] w-[44rem] max-w-full -translate-x-1/2" />

      <div className="mx-auto max-w-3xl px-6 py-14 md:px-8 md:py-20">
        <m.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
          className="relative mb-8 text-center font-display text-3xl font-bold tracking-tight text-zinc-50 [data-theme=light]:text-zinc-900 sm:text-4xl md:mb-10"
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
