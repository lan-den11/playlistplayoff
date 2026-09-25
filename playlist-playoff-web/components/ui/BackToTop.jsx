'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

// Floating back-to-top control for long homepage scrolls — appears once
// the visitor is roughly a viewport past the top, in the same glass
// language as the rest of the site (a round GlassButton-style surface).
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleClick() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          onClick={handleClick}
          aria-label="Back to top"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-zinc-200 backdrop-blur-xl backdrop-saturate-150 shadow-lg shadow-black/30 hover:bg-white/15"
        >
          <ArrowUp className="h-4 w-4" />
        </m.button>
      )}
    </AnimatePresence>
  );
}
