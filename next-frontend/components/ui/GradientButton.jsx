'use client';

import { motion } from 'framer-motion';

const GRADIENTS = {
  violet: 'from-violet-500 via-fuchsia-400 to-cyan-400',
  sunset: 'from-pink-500 via-rose-400 to-orange-400',
};

/**
 * Primary filled CTA. Renders a soft, breathing gradient glow behind a solid
 * gradient pill so the button reads as "alive" without animating the fill
 * itself (which would be noisy against body text).
 */
export default function GradientButton({
  children,
  gradient = 'violet',
  onClick,
  type = 'button',
  className = '',
}) {
  const stops = GRADIENTS[gradient] ?? GRADIENTS.violet;

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
        className={`absolute -inset-1 rounded-full bg-gradient-to-r ${stops} blur-lg opacity-60 group-hover:opacity-90 transition-opacity`}
        animate={{ opacity: [0.45, 0.75, 0.45] }}
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
