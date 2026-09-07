'use client';

import { motion } from 'framer-motion';

/**
 * Secondary CTA — translucent glass pill, used wherever a gradient button
 * would compete with a nearby primary action (nav, coming-soon section).
 */
export default function GlassButton({ children, onClick, type = 'button', className = '' }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-zinc-50 backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-colors ${className}`}
    >
      {children}
    </motion.button>
  );
}
