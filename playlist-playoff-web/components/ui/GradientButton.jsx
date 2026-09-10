'use client';

import { motion } from 'framer-motion';

const GRADIENTS = {
  brand: 'from-violet-500 to-indigo-500',
  gold: 'from-amber-400 to-orange-400',
};

export default function GradientButton({
  children,
  gradient = 'brand',
  onClick,
  type = 'button',
  className = '',
}) {
  const stops = GRADIENTS[gradient] ?? GRADIENTS.brand;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center justify-center ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className={`absolute -inset-1 rounded-full bg-gradient-to-r ${stops} blur-lg opacity-50 group-hover:opacity-80 transition-opacity`}
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span
        className={`relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${stops} px-7 py-3.5 text-sm font-semibold text-zinc-950 shadow-[0_1px_0_rgba(255,255,255,0.4)_inset]`}
      >
        {children}
      </span>
    </motion.button>
  );
}
