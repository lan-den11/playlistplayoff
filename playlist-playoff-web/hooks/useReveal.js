'use client';

import { useMemo } from 'react';
import { useIsMobile } from './useIsMobile';

const DESKTOP_SPRING = { type: 'spring', stiffness: 280, damping: 24 };
const MOBILE_TWEEN = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export function useReveal({ stagger = 0.12, distance = 24, amount = 0.3 } = {}) {
  const isMobile = useIsMobile();

  return useMemo(
    () => ({
      isMobile,
      container: {
        hidden: {},
        show: { transition: { staggerChildren: isMobile ? Math.min(stagger, 0.07) : stagger } },
      },
      item: {
        hidden: { opacity: 0, y: isMobile ? 14 : distance },
        show: (delay = 0) => ({
          opacity: 1,
          y: 0,
          transition: { ...(isMobile ? MOBILE_TWEEN : DESKTOP_SPRING), delay },
        }),
      },
      viewport: {
        once: true,
        amount: isMobile ? Math.min(amount, 0.2) : amount,
        margin: isMobile ? '0px 0px -40px 0px' : '0px',
      },
    }),
    [isMobile, stagger, distance, amount]
  );
}
