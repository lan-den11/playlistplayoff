'use client';

import { m } from 'framer-motion';

const ACCENT_GLOW = {
  brand: 'from-brand/70 via-brand/30 to-transparent',
  sideB: 'from-sky-400/70 via-sky-500/30 to-transparent',
  gold: 'from-amber-400/60 via-orange-400/35 to-transparent',
};

const ACCENT_GLASS = {
  brand:
    'from-brand/50 via-brand/30 to-brand-deep/40 group-hover:from-brand/60 group-hover:via-brand/40 group-hover:to-brand-deep/45',
  sideB:
    'from-sky-400/45 via-sky-500/30 to-sky-950/40 group-hover:from-sky-400/55 group-hover:via-sky-500/40 group-hover:to-sky-950/45',
  gold:
    'from-amber-400/45 via-orange-400/30 to-orange-950/40 group-hover:from-amber-400/55 group-hover:via-orange-400/40 group-hover:to-orange-950/45',
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
  const glass = ACCENT_GLASS[gradient] ?? ACCENT_GLASS.brand;
  const padding = SIZES[size] ?? SIZES.md;

  return (
    <m.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.05 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`group relative inline-flex items-center justify-center rounded-full disabled:opacity-60 ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute -inset-2.5 animate-glow-pulse rounded-full bg-gradient-to-r ${glow} blur-xl`}
      />
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full border border-white/30 bg-gradient-to-b ${glass} backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.35)] transition-colors`}
      />
      <span
        className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full font-semibold text-zinc-50 ${padding}`}
      >
        {children}
      </span>
    </m.button>
  );
}
