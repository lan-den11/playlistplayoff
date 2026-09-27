'use client';

import { AnimatePresence, motion } from 'framer-motion';

// One digit column: a fixed-height window that a new digit slides up into
// while the old one slides up and out, instead of the value just popping.
// `tabular-nums` on the parent keeps every digit the same width so nothing
// jitters horizontally as digits swap.
//
// Both this box AND `Separator` below center their content with
// `items-center` instead of relying on the parent's text baseline. A box
// whose only content is absolutely positioned (like this one) has no real
// text baseline, so browsers fall back to its bottom edge for baseline
// alignment — which sat inconsistently next to the comma's real baseline
// and was the actual root cause of the persistent clipped/jagged look,
// especially at the small font size used in the compact counter pill.
// Centering every character the same way, in the same fixed-height box,
// removes that mismatch for good instead of just re-tuning the height again.
function Digit({ char }) {
  return (
    <span className="relative inline-flex h-[1.25em] w-[0.7ch] items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-120%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center leading-none"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Non-digit characters (commas, etc.) — same fixed height + flex-centering
// as `Digit` above, so they share one consistent vertical rhythm with the
// animated digits instead of sitting on their own text baseline.
function Separator({ char }) {
  return (
    <span className="relative inline-flex h-[1.25em] items-center justify-center leading-none">
      {char}
    </span>
  );
}

// Renders `value` with each digit animating independently (comma separators
// and any other non-digit characters render as static text, since only
// digits actually "count"). Inherits font/weight/size from its
// `className` — callers set the type treatment, this just animates it.
export default function OdometerNumber({ value, className = '' }) {
  const chars = Number(value ?? 0).toLocaleString().split('');

  return (
    <span className={`inline-flex items-center tabular-nums ${className}`}>
      {chars.map((char, i) =>
        /[0-9]/.test(char) ? <Digit key={i} char={char} /> : <Separator key={i} char={char} />
      )}
    </span>
  );
}
