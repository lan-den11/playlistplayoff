PLAYLIST PLAYOFF — ROUND 2: HERO/HANDOFF FIX, ROUND-OF-128 FREEZE FIX,
WAITLIST MODE, CLERK THEMING, + A FLUID-INTERFACE AUDIT
================================================================================
This file replaces the previous README_CHANGES.txt. It documents everything
changed in this pass, why, and what still needs YOUR action (Clerk Dashboard
settings, verification against your real keys) since none of that can be
done from inside the repo.

--------------------------------------------------------------------------------
1. HOMEPAGE HERO — USA trending songs, 2 picks before handoff
--------------------------------------------------------------------------------
ASK: "top trending songs in America as a matchup, let the user make 2
selections then take them to the bracket screen."

WHAT WAS WRONG: HeroMatchup.jsx was already running a real, playable 8-song
bracket with live Spotify embeds (not a static mockup) — but it was seeded
from Spotify's "Top 50 - Global" playlist, not USA, and it waited for 5 real
picks before handing off to /bracket, not 2.

FIX:
  lib/spotifyAuth.js
    TRENDING_PLAYLIST_ID changed from 37i9dQZEVXbMDoHDwVN2tF (Top 50 - Global)
    to 37i9dQZEVXbLRQDuF5jeBp (Spotify's own "Top 50 - USA").
  components/home/HeroMatchup.jsx
    PICKS_BEFORE_HANDOFF changed from 5 to 2. Copy updated from "Trending on
    Spotify" to "Trending in the US".

Everything else about the teaser (real embeds, its own isolated localStorage
slot, the resume flow into /bracket?from=trending) was already correct and
is untouched.

--------------------------------------------------------------------------------
2. ROUND-OF-128 / 256 FREEZE — actual root cause this time
--------------------------------------------------------------------------------
ASK: "that round of 128 screen that you fixed is still freezing on my
screen and making the bracket unplayable."

ROOT CAUSE: components/bracket/BracketTree.jsx draws the connector lines
between rounds as an absolutely-positioned <svg> overlay sized to match its
scrollable wrapper. The bug: it measured `wrapEl` (the wrapper) and then
wrote new width/height attributes onto the <svg> that lives INSIDE that same
wrapper. Because the svg is a positioned child with an explicit size, giving
it a new size can itself nudge `wrapEl.scrollWidth/scrollHeight` by a
subpixel. A ResizeObserver was watching `wrapEl` — so that subpixel nudge
re-fired the observer, which redrew the svg, which changed the size again.
That's an unbounded feedback loop, not a one-time slowdown.

On a 32-song bracket the rounding error was too small to ever notice. On a
128/256-song bracket — much wider content, hundreds of connector paths
rebuilt on every iteration of the loop — it ran fast enough to pin the main
thread solid. That's "freezing, unplayable," not "a bit slow."

FIX (components/bracket/BracketTree.jsx), two parts, both required:
  1. A dedicated CONTENT ref (just the column of match boxes) is now
     measured and observed instead of the wrap ref the <svg> also lives in.
     Resizing the svg can never change the content node's size — they're
     siblings — so the observer can no longer be re-triggered by its own
     writes. The loop is now structurally impossible, not just throttled.
  2. A last-measured-size guard skips re-touching the DOM entirely when
     nothing actually changed, so a plain re-render (state changes on every
     pick) doesn't force a full recompute unless the geometry moved.
  Also dropped `backdrop-blur-md` from the individual match boxes — a
  128/256 bracket can render 100+ of these at once, and blurring each one is
  expensive to composite for basically zero visual gain at that box size.

--------------------------------------------------------------------------------
3. WAITLIST MODE
--------------------------------------------------------------------------------
ASK: "lets put the app in waitlist mode. make the button that says 'get
notified' sign users up for the waitlist with clerk."

WHAT CODE CAN DO vs. WHAT NEEDS YOUR ACCOUNT:
Clerk's actual "Waitlist" sign-up restriction is an account-level toggle in
the Clerk Dashboard — Configure > Restrictions > Sign-up modes > Waitlist.
No code change can flip that for you; you'll need to switch it on yourself.
Everything else is done:

  app/layout.jsx
    <ClerkProvider> now has `waitlistUrl="/waitlist"`, so once Waitlist mode
    is on, Clerk's own sign-in/sign-up flows send new visitors to OUR
    styled waitlist page instead of Clerk's generic Account Portal page.
  app/waitlist/page.jsx (NEW)
    A dedicated, app-styled page rendering Clerk's prebuilt <Waitlist />
    component.
  components/home/MultiplayerTeaser.jsx
    "Get notified" now actually collects an email and calls Clerk's real
    useWaitlist().join({ emailAddress }) — it used to just flip a local
    boolean and go nowhere. Shows a real error from Clerk (invalid email,
    already on the list, etc.) inline; shows "You're on the list" only once
    Clerk confirms the join.

IMPORTANT: until you flip that Dashboard toggle, `waitlist.join()` will
return a real error (something like sign-ups not being restricted to a
waitlist) — the form still renders and behaves correctly, it just won't
succeed yet. That's expected, not a bug in this code.

--------------------------------------------------------------------------------
4. CLERK APPEARANCE — matches the app's dark/violet/glass design
--------------------------------------------------------------------------------
ASK: "make clerk background match the rest of the app design too."

  app/layout.jsx
    Added an `appearance` object to <ClerkProvider> — `variables` sets the
    core palette (violet-500 primary, zinc-950 background, zinc-900 inputs,
    the same rose/emerald used elsewhere for errors/success), and `elements`
    applies Tailwind classes for the specific pieces (card, buttons, dividers,
    the UserButton popover, form fields) so the sign-in modal and
    /waitlist page read as part of Playlist Playoff instead of a bolted-on
    default widget.

I deliberately did NOT add @clerk/themes as a new dependency for this —
everything needed is achievable with plain `variables`/`elements`, and
adding a new package is one more thing that can fail to install or conflict
with your pinned @clerk/nextjs version for zero extra benefit here.

HONESTY CHECK: I can't render Clerk's actual hosted components in this
sandbox (no live Clerk keys, no browser) to visually confirm every single
class lands pixel-perfect. Unrecognized keys are silently ignored by Clerk
(this is a plain JS object, not TypeScript) so nothing will break either
way — but please eyeball the sign-in modal and /waitlist page once this is
deployed with your real keys, since that's the one part of this round I
could not verify with my own eyes.

--------------------------------------------------------------------------------
5. AUDIT — against the Apple "fluid interfaces" design skill
--------------------------------------------------------------------------------
You asked me to audit the app against the provided Apple design-motion
reference. Most of what's already here already follows it well: springs
(not fixed-duration CSS animations) on essentially every interactive
element, whileHover/whileTap feedback that fires on press not release,
translucent glass materials with sensible weight hierarchy, rem-based
Tailwind type sizes (Dynamic-Type-friendly by default).

Two real bugs found and fixed, plus one real gap closed:

  a) BUG — round-change overlay blocked input.
     components/bracket/BattleScreen.jsx: the full-screen "Round of 32" /
     "Semifinal" flash toast had no `pointer-events-none`, so for its whole
     ~1.1s it silently ate clicks/taps on "Choose Song" and the control row
     underneath. Fixed: added pointer-events-none — it's now purely
     informational, exactly like the doc's "never lock out input during a
     transition" principle.

  b) GAP — "reduced motion" didn't actually reduce most of the motion.
     globals.css already had a `@media (prefers-reduced-motion: reduce)`
     block, but that only affects plain CSS transitions/animations. Nearly
     every animation in this app runs through Framer Motion (springs,
     AnimatePresence, whileHover/whileTap), which animates transform/opacity
     directly via JS — that CSS block was a no-op for almost the entire UI.
     Fixed: app/layout.jsx now wraps the app in Framer Motion's own
     <MotionConfig reducedMotion="user">, which is the library's built-in,
     zero-per-component-changes way to honor the OS-level setting.

  c) GAP — no support for prefers-reduced-transparency or prefers-contrast.
     The app leans heavily on backdrop-blur glass panels with subtle
     border-white/10 borders, with no fallback for either OS accessibility
     setting. Added two small, safe, global CSS blocks in globals.css:
     dropping backdrop-filter under reduced-transparency, and boosting
     border opacity under increased-contrast.

Noted but NOT changed (would be a much bigger, riskier diff for
comparatively little payoff right now — happy to do any of these as a
separate, focused pass if you want them):
  - Per-size letter-tracking on headings (the doc recommends tighter tracking
    at larger sizes; the app currently uses one `tracking-tight` value across
    every heading size from text-lg to text-7xl).
  - There's no drag/swipe gesture anywhere in the bracket flow (it's all
    button + arrow-key driven) — most of the doc's direct-manipulation,
    velocity-handoff, and momentum-projection guidance doesn't apply yet
    because there's no gesture to apply it to. A "swipe to pick" gesture on
    the battle screen would be a natural, on-brand place to use it later.

--------------------------------------------------------------------------------
FILES CHANGED
--------------------------------------------------------------------------------
  lib/spotifyAuth.js                    — USA playlist ID (fix #1)
  components/home/HeroMatchup.jsx       — 2 picks before handoff, copy (fix #1)
  components/bracket/BracketTree.jsx    — resize-loop root-cause fix (fix #2)
  components/bracket/BattleScreen.jsx   — pointer-events-none on round flash (audit)
  app/layout.jsx                        — Clerk appearance + waitlistUrl + MotionConfig
  app/waitlist/page.jsx                 — NEW: styled /waitlist page
  components/home/MultiplayerTeaser.jsx — real Clerk waitlist join
  app/globals.css                       — reduced-transparency + increased-contrast (audit)

Everything else is copied over unchanged — no unrelated rewrites, nothing
you already liked should have moved or changed look.

--------------------------------------------------------------------------------
WHAT YOU NEED TO DO
--------------------------------------------------------------------------------
1. Clerk Dashboard > Configure > Restrictions > Sign-up modes > switch to
   Waitlist. This is the ONLY step that actually "turns on" waitlist mode —
   everything else is already wired up to work the moment you do this.
2. Make sure NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY are set on
   your hosting platform's environment variables dashboard (not just
   .env.local, which is gitignored and never deployed).
3. Visually check the sign-in modal, UserButton popover, and /waitlist page
   against your real Clerk keys — I built the appearance overrides against
   Clerk's current documented element/variable names but couldn't render
   them live in this sandbox to confirm pixel-for-pixel.
4. No new env vars and no new dependencies were introduced this round —
   `npm install` should need to do nothing new.

HOW TO RUN
-----------
  npm install
  cp .env.example .env.local   # then fill in your real values
  npm run dev
