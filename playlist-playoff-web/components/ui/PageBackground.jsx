import GhostFibers from './GhostFibers';
import DotGrid from './DotGrid';

// Sits behind the entire homepage, pinned to the viewport with `fixed`
// (not tied to document height) so the ghost-fiber effect stays visible
// everywhere as the page scrolls, at a consistent size no matter the
// viewport — rather than being scoped to just the Hero section's own
// height like it was before. Brightness is toned down from the old
// hero-only values since this now sits behind text-heavy sections too and
// needs to stay legible everywhere, not just look good behind a big empty
// hero. The gradient scrim adds a light-top/dark-bottom vignette on top,
// which also doubles as the "depth" pass for sections lower on the page.
//
// Layer order is explicit (z-0 → z-10 → z-20) rather than left to DOM order:
// fibers (WebGL) → interactive dot grid → scrim. The dots are guaranteed to
// paint in front of the fibers; the scrim sits over both so the dots fade
// with the same vignette, and the grid wrapper's opacity keeps the resting
// dots a texture, not a pattern.
//
// Colors: fibers use brand-deep / brand (#0A1A6B / #1240EA). The dots are
// deliberately a lighter, softer blue than the fibers' glow so they read as
// their own layer instead of blending into it — resting #5C80F7, lit
// (near the pointer) #B4C8FF. All hue ~225-231deg (true blue, no violet).
// Keep in sync with the `brand` tokens in tailwind.config.js. Tune
// `dotSize` / `baseColor` / the wrapper opacity to taste.
export default function PageBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <GhostFibers
        lineColor="#0A1A6B"
        glowColor="#1240EA"
        brightness={1.6}
        glowIntensity={1.3}
        speed={0.16}
        className="z-0"
      />
      <div className="absolute inset-0 z-10 opacity-80">
        <DotGrid
          dotSize={4.5}
          gap={28}
          baseColor="#5C80F7"
          activeColor="#B4C8FF"
          proximity={140}
          shockRadius={220}
          shockStrength={4}
        />
      </div>
      <div className="absolute inset-0 z-20 bg-gradient-to-b from-zinc-950/10 via-zinc-950/55 to-zinc-950/85" />
    </div>
  );
}
