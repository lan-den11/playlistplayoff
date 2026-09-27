'use client';

import { AnimatePresence, motion } from 'framer-motion';

// One digit column: a fixed-height window that a new digit slides up into
// while the old one slides up and out. Height is a flat integer pixel value
// (h-4 = 16px) instead of `em` — the previous `1.25em` box was 13.75px at
// this component's 11px font, and clipping a sliding glyph mid-pixel is
// what made this look "choppy". `backface-visibility: hidden` (autoprefixed
// to -webkit- via postcss) is the standard fix for text losing subpixel
// antialiasing — going blurry — mid-transform under a backdrop-blur
// ancestor like this pill.
function Digit({ char }) {
  return (
    <span className="relative inline-flex h-4 w-[0.7ch] items-center justify-center overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={char}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="absolute inset-0 flex items-center justify-center leading-none [backface-visibility:hidden] will-change-transform"
        >
          {char}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

// Non-digit characters (commas, etc.) — same fixed height as `Digit` above,
// so they share one consistent vertical rhythm with the animated digits
// instead of sitting on their own text baseline.
function Separator({ char }) {
  return (
    <span className="relative inline-flex h-4 items-center justify-center leading-none">
      {char}
    </span>
  );
}

// Renders `value` with each digit sliding up independently on change (comma
// separators and any other non-digit characters render as static text,
// since only digits actually "count"). Inherits font/weight/size from its
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