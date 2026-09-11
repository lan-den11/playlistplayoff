'use client';

import { motion } from 'framer-motion';
import GlassSurface from './GlassSurface';

// 'brand' is the neutral, clear-glass default used everywhere. 'gold' is the
// one deliberate exception — reserved for champion / celebratory moments
// (see ChampionScreen), matching the app's existing rule that amber/orange
// only ever shows up there. Everything else stays clear white glass, no
// flat color-gradient fills.
const ACCENT_GLOW = {
  brand: 'from-white/25 via-white/10 to-transparent',
  gold: 'from-amber-400/50 via-orange-400/35 to-transparent',
};

export default function GradientButton({
  children,
  gradient = 'brand',
  onClick,
  type = 'button',
  className = '',
}) {
  const glow = ACCENT_GLOW[gradient] ?? ACCENT_GLOW.brand;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center justify-center rounded-full ${className}`}
    >
      <motion.span
        aria-hidden="true"
        className={`absolute -inset-2 rounded-full bg-gradient-to-r ${glow} blur-xl opacity-70 transition-opacity group-hover:opacity-100`}
        animate={{ opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={999}
        backgroundOpacity={0.14}
        opacity={0.9}
        blur={9}
        brightness={65}
        saturation={1.6}
        style={{ position: 'absolute', inset: 0 }}
      />
      <span className="relative z-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-zinc-50 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]">
        {children}
      </span>
    </motion.button>
  );
}
