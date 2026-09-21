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
// Layer order: fibers (WebGL) → interactive dot grid → scrim. The grid sits
// under the scrim so it fades with the same vignette, and its wrapper
// opacity keeps the resting dots a texture, not a pattern.
//
// Colors: fibers use brand-deep / brand and the dots use a mid blue / brand-
// light — all hue ~225-231deg (true blue, no violet). Keep in sync with the
// `brand` tokens in tailwind.config.js. Dots are 6px (was 3px, effectively
// invisible on phones) and brighter so they read against the fibers + scrim;
// tune `dotSize` / `baseColor` / the wrapper opacity to taste.
export default function PageBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10">
      <GhostFibers lineColor="#0A1A6B" glowColor="#1240EA" brightness={1.6} glowIntensity={1.3} speed={0.16} />
      <div className="absolute inset-0 opacity-80">
        <DotGrid
          dotSize={6}
          gap={28}
          baseColor="#3554C8"
          activeColor="#7C9CFF"
          proximity={140}
          shockRadius={220}
          shockStrength={4}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/10 via-zinc-950/55 to-zinc-950/85" />
    </div>
  );
}
