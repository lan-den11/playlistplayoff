'use client';

import { AnimatePresence, motion } from 'framer-motion';

// One digit column: a fixed-height window that a new digit slides up into
// while the old one slides up and out, instead of the value just popping.
// `tabular-nums` on the parent keeps every digit the same width so nothing
// jitters horizontally as digits swap.
function Digit({ char }) {
  return (
    <span className="relative inline-block h-[1.1em] w-[0.62ch] overflow-hidden align-top">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-120%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Renders `value` with each digit animating independently (comma separators
// and any other non-digit characters render as plain static text, since
// only digits actually "count").
export default function OdometerNumber({ value, className = '' }) {
  const chars = Number(value ?? 0).toLocaleString().split('');

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {chars.map((char, i) =>
        /[0-9]/.test(char) ? (
          <Digit key={i} char={char} />
        ) : (
          <span key={i} className="inline-block">
            {char}
          </span>
        )
      )}
    </span>
  );
}
