const SIZES = {
  sm: { box: 'h-9 w-9 rounded-2xl', icon: 'h-4 w-4' },
  md: { box: 'h-11 w-11 rounded-2xl', icon: 'h-5 w-5' },
  lg: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6' },
};

export default function GlassIconBadge({ icon: Icon, size = 'md', className = '' }) {
  const s = SIZES[size] ?? SIZES.md;

  return (
    <span className={`relative inline-flex flex-none items-center justify-center ${s.box} ${className}`}>
      <span
        aria-hidden="true"
        className="absolute -inset-1.5 rounded-[inherit] bg-gradient-to-br from-brand/60 via-brand/25 to-transparent blur-md opacity-80"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 rounded-[inherit] border border-white/30 bg-gradient-to-b from-brand/50 via-brand/30 to-brand-deep/40 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-1px_0_rgba(255,255,255,0.1),0_8px_24px_rgba(0,0,0,0.35)]"
      />
      <Icon className={`relative z-10 text-zinc-50 ${s.icon}`} strokeWidth={Icon.glyphStrokeWidth ?? 2.5} />
    </span>
  );
}
