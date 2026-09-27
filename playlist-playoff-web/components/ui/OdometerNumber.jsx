'use client';

import { useCallback, useLayoutEffect, useRef, useState } from 'react';

// Digits 0-9 repeated three times so any increment — including a 9→0 carry,
// even a couple back-to-back — always scrolls the SAME direction instead of
// ever snapping backward or running off the end of the strip.
const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

// One digit's rolling window. Unlike the old approach, nothing here is ever
// created or destroyed: it's ONE persistent strip of digits sliding via a
// plain CSS `transform` transition — exactly like a real mechanical
// odometer or an airport departure board. That's what removes the
// blur/choppiness for good. Repeatedly unmounting and remounting a DOM node
// forces the browser to rasterize a brand-new GPU layer on every tick, which
// is what looked glitchy under this pill's backdrop-blur; a single node
// animated with a CSS transform stays on one compositor layer the whole
// time.
function Digit({ value, rowHeight, onMeasure }) {
  const firstRef = useRef(null);
  const [position, setPosition] = useState(value); // index into STRIP
  const [instant, setInstant] = useState(true); // no transition on first paint or wrap-reset
  const lastValueRef = useRef(value);

  useLayoutEffect(() => {
    if (firstRef.current) onMeasure(firstRef.current.getBoundingClientRect().height);
  }, [onMeasure]);

  useLayoutEffect(() => {
    if (value === lastValueRef.current) return;
    const prev = lastValueRef.current;
    const steps = value > prev ? value - prev : value + 10 - prev; // steps forward, carry included
    lastValueRef.current = value;
    setInstant(false);
    setPosition((p) => p + steps);
  }, [value]);

  // The moment the real slide finishes, if we've scrolled past the strip's
  // first cycle, silently rewind by 10 (transition off for that one jump) —
  // invisible, since STRIP[i] === STRIP[i - 10]. Keeps the transform value
  // from growing forever on a counter that only goes up.
  function handleTransitionEnd() {
    if (position < 10) return;
    setInstant(true);
    setPosition((p) => p - 10);
  }

  return (
    <span
      className="relative inline-flex w-[0.7ch] items-center justify-center overflow-hidden align-bottom"
      style={{ height: rowHeight || '1em' }}
    >
      <span
        onTransitionEnd={handleTransitionEnd}
        className="absolute left-0 top-0 flex w-full flex-col items-center"
        style={{
          transform: rowHeight ? `translateY(-${position * rowHeight}px)` : 'none',
          transition: instant ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {STRIP.map((d, i) => (
          <span key={i} ref={i === 0 ? firstRef : undefined} className="flex justify-center leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

// Non-digit characters (commas, etc.) — same baseline as the rolling digits.
function Separator({ char }) {
  return <span className="inline-flex items-center leading-none">{char}</span>;
}

// Renders `value` with each digit rolling independently on change. Inherits
// font/weight/size from `className` — callers set the type treatment, this
// just animates it. Public API (`value`, `className`) is unchanged, so
// LiveCounter.jsx needs no edits.
export default function OdometerNumber({ value, className = '' }) {
  const [rowHeight, setRowHeight] = useState(0);
  const handleMeasure = useCallback((h) => setRowHeight((prev) => prev || h), []);
  const chars = Number(value ?? 0).toLocaleString().split('');

  return (
    <span className={`inline-flex items-center tabular-nums ${className}`}>
      {chars.map((char, i) =>
        /[0-9]/.test(char) ? (
          <Digit key={i} value={Number(char)} rowHeight={rowHeight} onMeasure={handleMeasure} />
        ) : (
          <Separator key={i} char={char} />
        )
      )}
    </span>
  );
}