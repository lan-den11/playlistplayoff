'use client';

import { motion } from 'framer-motion';

// Every accent lives in the same blue family now. 'brand' / 'sideB' are two
// shades of blue used to tell the two songs in a matchup apart at a glance
// (see BattleScreen / HeroMatchup) — no more violet-vs-teal. 'gold' stays
// the one deliberate exception, reserved for champion / celebratory moments.
//
// The glass itself is plain backdrop-filter, not the SVG-displacement
// GlassSurface component — that effect depends on browser support for
// backdrop-filter: url(#svg-filter), which is inconsistent and hard to
// tune without a live browser to check it in. backdrop-blur + saturate is
// the standard, reliable way to get a real frosted-glass look and renders
// identically across Chrome/Edge/Safari/Firefox.
const ACCENT_GLOW = {
  brand: 'from-brand/70 via-brand/30 to-transparent',
  sideB: 'from-sky-400/70 via-sky-500/30 to-transparent',
  gold: 'from-amber-400/60 via-orange-400/35 to-transparent',
};

const SIZES = {
  md: 'px-7 py-3.5 text-sm',
  sm: 'px-4 py-2.5 text-xs',
};

export default function GradientButton({
  children,
  gradient = 'brand',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
}) {
  const glow = ACCENT_GLOW[gradient] ?? ACCENT_GLOW.brand;
  const padding = SIZES[size] ?? SIZES.md;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center justify-center rounded-full disabled:opacity-60 ${className}`}
    >
      {/* Ambient color glow — the brand identity bleeding through the glass */}
      <motion.span
        aria-hidden="true"
        className={`absolute -inset-2.5 rounded-full bg-gradient-to-r ${glow} blur-xl opacity-80 transition-opacity group-hover:opacity-100`}
        animate={{ opacity: [0.65, 0.9, 0.65] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* The actual frosted-glass pane — plain, reliable backdrop-filter */}
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-full border border-white/25 bg-white/10 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),inset_0_-1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.35)] transition-colors group-hover:bg-white/[0.15]"
      />
      <span className={`relative z-10 inline-flex items-center gap-2 rounded-full font-semibold text-zinc-50 ${padding}`}>
        {children}
      </span>
    </motion.button>
  );
}
