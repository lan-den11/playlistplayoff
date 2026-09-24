// Skeleton "bone" with a light sweep. The sweep is a CSS keyframe
// (animate-shimmer → transform only), so it runs on the compositor and keeps
// moving even while the main thread is busy loading the playlist/embeds.
// Size and rounding come from `className`.
export default function Bone({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block overflow-hidden bg-white/10 [data-theme=light]:bg-black/[0.06] ${className}`}
    >
      <span className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent [data-theme=light]:via-black/10" />
    </span>
  );
}
