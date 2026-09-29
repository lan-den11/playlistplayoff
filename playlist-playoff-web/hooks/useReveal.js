'use client';

import { useMemo } from 'react';
import { useIsMobile } from './useIsMobile';

const DESKTOP_SPRING = { type: 'spring', stiffness: 280, damping: 24 };
const MOBILE_TWEEN = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

export function useReveal({ stagger = 0.12, distance = 24, amount = 0.3 } = {}) {
  const isMobile = useIsMobile();

  return useMemo(
    () => ({
      container: {
        hidden: {},
        show: { transition: { staggerChildren: isMobile ? Math.min(stagger, 0.07) : stagger } },
      },
      item: {
        hidden: { opacity: 0, y: isMobile ? 14 : distance },
        show: { opacity: 1, y: 0, transition: isMobile ? MOBILE_TWEEN : DESKTOP_SPRING },
      },
      viewport: { once: true, amount: isMobile ? Math.min(amount, 0.15) : amount },
    }),
    [isMobile, stagger, distance, amount]
  );
}
