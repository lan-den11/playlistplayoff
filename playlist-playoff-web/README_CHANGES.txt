PLAYLIST PLAYOFF — REBUILD + REAL BUG FIX (repo was wiped, rebuilt from source)
================================================================================

WHAT WAS ACTUALLY WRONG
-------------------------
1. "Every song besides the first matchup" had a dead Spotify embed.
   ROOT CAUSE: hooks/useSpotifyEmbed.js used a plain `useRef` object for the
   iframe host element. BattleScreen.jsx wrapped each side's panel in a
   motion.div keyed on the matchup (`key={`a-${matchKey}`}`). Every new song
   pair made React tear down and rebuild that whole subtree — including the
   <div> the Spotify controller was attached to. A plain ref never re-fires
   when the DOM node underneath it gets swapped, so the controller built on
   the very first matchup just kept sitting there pointed at a node that no
   longer existed. loadUri() calls after that did nothing visible. This is
   why matchup #1 always worked and every one after it was frozen/blank.

   THE FIX: two changes, not a band-aid.
     a) useSpotifyEmbed.js now uses a CALLBACK ref instead of an object ref.
        It rebuilds the controller any time the node it's attached to
        actually changes — so the hook is now correct even if something
        else in the tree remounts its container.
     b) BattleScreen.jsx no longer keys the side panels on the matchup at
        all, so the embed's host <div> is never destroyed in the first
        place — it just gets re-targeted via loadUri() like it always
        should have. Track name/art still animate in fresh per matchup via
        their own (separately keyed) AnimatePresence, so nothing about the
        "feels alive" motion design was lost.
     c) EmbedPanel was pulled out of BattleScreen.jsx into its own file
        (components/bracket/EmbedPanel.jsx) so it's ONE implementation
        shared by both BattleScreen and the new homepage teaser below —
        can't have two copies drift out of sync again.

2. The homepage hero wasn't actually playable.
   It was a static, image-only mockup (TeaserCard) — no audio, just album
   art and a "Choose Song" button making a blind pick. That's not the
   product; it's a screenshot pretending to be the product.

   THE FIX: components/home/HeroMatchup.jsx (replaces the old inline
   InteractiveMatchup in Hero.jsx) now runs a REAL embedded Spotify player
   on both sides, using the exact same EmbedPanel + useSpotifyEmbed hook as
   the full /bracket experience. Same audio, same loading-spinner treatment,
   same glass-card / gradient-side visual language. It's not "hero, but
   different" anymore — it's the actual battle screen mechanic, just running
   a smaller 8-song bracket seeded from Spotify's live Top 50 Global
   playlist. After 5 real picks it hands off to /bracket?from=trending,
   same as before.

FILES ADDED
------------
  components/bracket/EmbedPanel.jsx   — shared embed host + loading overlay
  components/home/HeroMatchup.jsx     — real, playable homepage teaser
  .env.example                        — see below

FILES CHANGED (logic, not just moved)
---------------------------------------
  hooks/useSpotifyEmbed.js            — callback ref (root-cause fix)
  components/bracket/BattleScreen.jsx — no more per-matchup remount key;
                                         imports EmbedPanel instead of
                                         defining it inline
  components/home/Hero.jsx            — now just the section shell + CTA;
                                         renders HeroMatchup

EVERYTHING ELSE is copied over unchanged from what you had — no unrelated
rewrites, so nothing you already liked should have moved or changed look.

ENV — YOU NEED TO SET THESE YOURSELF
---------------------------------------
Copy .env.example to .env.local and fill in your real values (this file is
gitignored, same as before, so it will never get committed):

  SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET   — required for anything to load
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY — required for auth
  DATABASE_URL                                — optional (profile save/load)
  LASTFM_API_KEY / LASTFM_USERNAME            — optional (play counts)

If SPOTIFY_CLIENT_ID/SECRET aren't set, the homepage teaser will show the
static, non-interactive fallback card instead of erroring or looking broken.

HOW TO RUN
-----------
  npm install
  cp .env.example .env.local   # then fill in your real values
  npm run dev
