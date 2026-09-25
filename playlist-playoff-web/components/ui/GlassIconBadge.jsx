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
        className="absolute inset-0 rounded-[inherit] border border-white/25 bg-gradient-to-b from-brand/45 via-brand/25 to-brand-deep/40 backdrop-blur-xl backdrop-saturate-150 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-1px_0_rgba(255,255,255,0.08),0_6px_16px_rgba(0,0,0,0.3)]"
      />
      <Icon className={`relative z-10 text-zinc-50 ${s.icon}`} strokeWidth={2.5} />
    </span>
  );
}
