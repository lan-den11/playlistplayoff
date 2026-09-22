'use client';

import { m } from 'framer-motion';

// Every accent lives in the same blue family now. 'brand' / 'sideB' are two
// shades of blue used to tell the two songs in a matchup apart at a glance
// (see BattleScreen / HeroMatchup) — no more violet-vs-teal. 'gold' stays
// the one deliberate exception, reserved for champion / celebratory moments.
//
// The glass pane (ACCENT_GLASS) carries its own tinted gradient rather than
// a flat translucent white. Previously the only color came from the glow
// bleeding through backdrop-blur, which is fragile and browser-dependent —
// on a flat background, or if backdrop-filter is even slightly off, the
// button just reads as plain grey glass. Tinting the pane itself guarantees
// genuine "blue liquid glass" regardless of what's behind it; the glow
// (ACCENT_GLOW) still adds extra ambient bleed and depth on top of that.
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
      {/* Ambient color glow — the brand identity bleeding through the glass.
          The pulse is a CSS keyframe (opacity only → compositor), not a JS
          spring loop: five of these are on the homepage at once. */}
      <span
        aria-hidden="true"
        className={`absolute -inset-2.5 animate-glow-pulse rounded-full bg-gradient-to-r ${glow} blur-xl`}
      />
      {/* The frosted-glass pane — tinted per accent (top-lit, deeper at the
          bottom, like light catching a curved liquid surface), plus
          backdrop-blur/saturate for the frosted quality wherever it sits
          over real content. */}
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full border border-white/30 bg-gradient-to-b ${glass} backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.35)] transition-colors`}
      />
      {/* whitespace-nowrap: without it, a button squeezed by a flex
          sibling (e.g. the email field in WaitlistForm) can shrink the text
          span below its content's natural width, wrapping the icon and
          label onto two lines. */}
      <span
        className={`relative z-10 inline-flex items-center gap-2 whitespace-nowrap rounded-full font-semibold text-zinc-50 ${padding}`}
      >
        {children}
      </span>
    </m.button>
  );
}
