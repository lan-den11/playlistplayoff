'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';

// LazyMotion + `m.*` components ship only the DOM animation features
// (springs, variants, hover/tap, in-view, exit) instead of the full motion
// bundle — a much smaller first-load JS payload on the homepage. Lives in a
// client component because the feature bundle can't cross the server→client
// boundary as a prop. Plain `motion.*` components (the bracket screens) keep
// working unchanged inside it.
export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
