'use client';

import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
