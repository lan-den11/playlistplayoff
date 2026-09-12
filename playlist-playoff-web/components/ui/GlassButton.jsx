'use client';

import { motion } from 'framer-motion';

// Secondary button — same reliable backdrop-filter glass as GradientButton,
// just without the colored ambient glow, so it reads as the quieter action.
export default function GlassButton({ children, onClick, type = 'button', className = '' }) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center justify-center rounded-full ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-white/20 bg-white/[0.07] backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-1px_0_rgba(255,255,255,0.06),0_6px_18px_rgba(0,0,0,0.3)] transition-colors group-hover:bg-white/[0.12]"
      />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-zinc-50">
        {children}
      </span>
    </motion.button>
  );
}
