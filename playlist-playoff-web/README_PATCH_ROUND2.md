# Round 2 patch — "improve the homepage across the board"

This is a SECOND, separate patch — apply it on top of the previous
playlist-playoff-patch.zip (or your already-updated repo). Only files
touched in this round are included; nothing here needs deleting.

Copy `playlist-playoff-web/` on top of your repo (same relative paths,
overwrite on conflict). No new dependencies — everything below uses
framer-motion and lucide-react, both already in your package.json.

## What's in it

**New reusable component:**
- `components/ui/BackToTop.jsx` — floating glass button, bottom-right,
  fades in once you've scrolled ~80% of a viewport height, smooth-scrolls
  to top. Wired into `app/page.jsx`.

**Component-library-wide polish (affects every button site-wide, bracket
flow included):**
- `components/ui/GradientButton.jsx` and `components/ui/GlassButton.jsx` —
  added a diagonal light-sweep across the glass on hover, instead of just
  the existing scale bump. Subtle, on-brand, no new deps.

**Site header:**
- `components/ui/SiteHeader.jsx` — now sticky, and scroll-adaptive:
  transparent over the hero, fades in its glass/blur/shadow after ~12px of
  scroll. (Flagging this one specifically: the old version had a comment
  saying "Deliberately NOT sticky" — I overrode that on purpose since you
  gave blanket visual-changes permission, but say the word if you want it
  back to non-sticky.)

**Homepage sections:**
- `components/home/GenreToggle.jsx` — each tab now has an icon
  (Trending/Flame, Hip-Hop/Headphones, Pop/Sparkles, Rock/Music2).
- `components/home/HowItWorks.jsx` — small connector arrows between the 3
  steps on desktop, and the step icons now do a playful rotate+scale on
  hover.
- `components/home/Differentiator.jsx` — the "Homecoming" mockup card now
  does a subtle cursor-tilt (3D perspective) on hover; skipped for
  prefers-reduced-motion. Still has the resize fix from round 1.
- `components/home/Faq.jsx` — the open FAQ item now gets a brand-tinted
  border/background and its icon + question text pick up the brand-light
  color, so the active state reads more clearly.
- `components/home/Footer.jsx` — fades/slides in on scroll instead of
  being static; wordmark is now a link back home with a hover color shift.
- `components/home/MultiplayerTeaser.jsx` — small `animate-pulse` added to
  the "Coming soon" badge's Sparkles icon, so it reads as a live status
  rather than a flat label.

## Audit you asked about
Checked `HowItWorks.jsx`, `Faq.jsx`, and `MultiplayerTeaser.jsx` for the
same resize-breaking pattern as the Differentiator sliders (round 1): all
three use ONE parent `whileInView` driving staggered children via Framer
Motion `variants`, not multiple sibling elements each running their own
`whileInView` + IntersectionObserver. That's the safe pattern — no change
needed there.

## Scope call
Didn't introduce a new component library (e.g. shadcn/ui) — your site
already has its own bespoke one (GradientButton, GlassButton,
GlassIconBadge, Glow, etc.) and bolting on a second, differently-styled
system this close to launch would fight your design language more than
help it. Instead I leaned harder on the two libraries already in your
stack (Framer Motion, Lucide) across more of the homepage.
