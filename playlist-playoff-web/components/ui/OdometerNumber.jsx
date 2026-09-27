'use client';

import { useLayoutEffect, useRef, useState } from 'react';

const STRIP = Array.from({ length: 30 }, (_, i) => i % 10);

function Digit({ value }) {
  const [position, setPosition] = useState(value);
  const [instant, setInstant] = useState(true);
  const lastValueRef = useRef(value);

  useLayoutEffect(() => {
    if (value === lastValueRef.current) return;
    const prev = lastValueRef.current;
    const steps = value > prev ? value - prev : value + 10 - prev;
    lastValueRef.current = value;
    setInstant(false);
    setPosition((p) => p + steps);
  }, [value]);

  function handleTransitionEnd() {
    if (position < 10) return;
    setInstant(true);
    setPosition((p) => p - 10);
  }

  return (
    <span className="relative inline-block w-[1ch] h-[1em] overflow-hidden align-bottom">
      <span
        onTransitionEnd={handleTransitionEnd}
        className="absolute left-0 top-0 flex w-full flex-col items-center"
        style={{
          transform: `translateY(-${position}em)`,
          transition: instant ? 'none' : 'transform 0.38s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {STRIP.map((d, i) => (
          <span key={i} className="flex h-[1em] items-center justify-center leading-none">
            {d}
          </span>
        ))}
      </span>
    </span>
  );
}

function Separator({ char }) {
  // Removed flex positioning so commas/decimals sit on the natural text baseline
  return <span className="leading-none">{char}</span>;
}

export default function OdometerNumber({ value, className = '' }) {
  const chars = Number(value ?? 0).toLocaleString().split('');

  return (
    <span className={`inline-flex items-end tabular-nums ${className}`}>
      {chars.map((char, i) =>
        /[0-9]/.test(char) ? (
          <Digit key={i} value={Number(char)} />
        ) : (
          <Separator key={i} char={char} />
        )
      )}
    </span>
  );
}