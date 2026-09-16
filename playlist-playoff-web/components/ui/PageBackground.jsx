import GhostFibers from './GhostFibers';

// Sits behind the entire homepage, pinned to the viewport with `fixed`
// (not tied to document height) so the ghost-fiber effect stays visible
// everywhere as the page scrolls, at a consistent size no matter the
// viewport — rather than being scoped to just the Hero section's own
// height like it was before. Brightness is toned down from the old
// hero-only values since this now sits behind text-heavy sections too and
// needs to stay legible everywhere, not just look good behind a big empty
// hero. The gradient scrim adds a light-top/dark-bottom vignette on top,
// which also doubles as the "depth" pass for sections lower on the page.
export default function PageBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <GhostFibers lineColor="#140E35" glowColor="#3437A0" brightness={1.6} glowIntensity={1.3} speed={0.16} />
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/10 via-zinc-950/55 to-zinc-950/85" />
    </div>
  );
}
