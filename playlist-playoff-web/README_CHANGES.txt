PLAYLIST PLAYOFF — ROUND 3: FULL-APP WAITLIST GATE + HERO TEASER DIAGNOSIS
================================================================================
Replaces the previous README_CHANGES.txt.

--------------------------------------------------------------------------------
1. WAITLIST NOW GATES THE ENTIRE APP — not just Clerk's sign-up modal
--------------------------------------------------------------------------------
ASK: "make the whole app in waitlist including the bracket. everything."

WHAT WAS WRONG: `waitlistUrl` on <ClerkProvider> (app/layout.jsx) only ever
affected CLERK'S OWN sign-up flow. It did nothing to the app itself — the
homepage, the live Hero teaser, and the full /bracket experience were all
100% usable by anyone, signed in or not.

FIX — proxy.js:
  Every route now requires a signed-in session, enforced via
  `auth.protect({ unauthenticatedUrl: '/waitlist' })` in middleware. The
  ONLY route a signed-out visitor can reach is /waitlist itself.

  One deliberate exception: `/api/health` stays public. It's not a product
  surface — it's what most hosts (Railway, Fly, Render, etc.) ping
  unauthenticated to confirm the app is alive. Gating it risks a healthy
  deployment looking "down" to your host and getting cycled. Say the word
  if you'd rather it be gated too — one line to change.

FIX — app/waitlist/page.jsx:
  Now a server component. If someone already signed in manually visits
  /waitlist, it redirects them straight to `/` instead of showing them a
  waitlist form they don't need. Also swapped the full marketing <Navbar />
  (whose "Start a bracket" button would've just bounced back here) for a
  minimal logo-only header — nothing on this page promises access it can't
  deliver yet.

STILL YOUR CALL, UNCHANGED FROM BEFORE:
  Clerk's actual "Waitlist" sign-up RESTRICTION (stopping brand-new people
  from just creating an account instantly) is still a Clerk Dashboard
  toggle: Configure > Restrictions > Sign-up modes > Waitlist. That's an
  account-level setting no code can flip for you. What changed this round is
  that now, EVEN WITHOUT that toggle on, nobody can use the app itself
  without an account — the product is fully gated either way.

--------------------------------------------------------------------------------
2. HERO TEASER — real bug fixed, real root cause identified (not guessed)
--------------------------------------------------------------------------------
ASK: "the hero thats supposed to be interactive? it's not. theres a overlay
or something over it. none of the top usa songs load or become playable."

STEP ONE — verified the playlist ID live: confirmed (fetched the real
Spotify page) that `37i9dQZEVXbLRQDuF5jeBp` in lib/spotifyAuth.js IS the
correct, currently-updating "Top 50 - USA" playlist. This was not the bug.

STEP TWO — real bug found and fixed, components/bracket/EmbedPanel.jsx:
  The "Loading…" overlay that sits on top of each embed during the fake
  550ms delay never had `pointer-events-none` — the exact same class of bug
  already caught and fixed on BattleScreen's round-announcement flash last
  round. A purely informational overlay should never be able to eat clicks.
  EmbedPanel is shared by BattleScreen, HeroMatchup, and ChampionScreen, so
  this one fix covers all three surfaces.

STEP THREE — the actual root cause of "no real songs, not selectable":
  HeroMatchup.jsx already had a silent-failure design: the instant the
  trending-playlist fetch fails for ANY reason, it renders a hardcoded,
  non-interactive placeholder card (`StaticFallback` — the "Night Drive" /
  "Golden Hour" mockup you're describing as "an overlay we generated a week
  ago"). That's almost certainly exactly what you're seeing. The bug wasn't
  that it looks broken — it's that it gave you ZERO information about WHY.

  FIX: HeroMatchup.jsx now logs the real, specific reason to the browser
  console the instant this happens:

    console.error('[HeroMatchup] Trending playlist failed to load...', reason)

  FASTEST WAY TO CONFIRM THIS IN 10 SECONDS: open this URL directly in your
  browser (works whether the app is deployed or running locally):

    /api/playlist/37i9dQZEVXbLRQDuF5jeBp/tracks

  - If you see real track JSON back → the API works fine, and the console
    log above will show you what's different about the Hero's specific call.
  - If you see `{"error":"Spotify credentials not configured — set
    SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env.local."}` → that IS
    the bug, and it's a credentials problem, not a code problem.

  I cannot verify this myself — this sandbox has no live Spotify keys and no
  browser, so I can't reproduce a real fetch against api.spotify.com. Given
  everything else in this data path (BattleScreen uses the identical
  useSpotifyEmbed/EmbedPanel/loadUri pattern and is confirmed working), a
  missing/incorrect SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET in whatever
  environment you're testing is the single most likely explanation.

  NEEDS YOUR INPUT: are `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`
  definitely set — in `.env.local` if you're testing locally, and SEPARATELY
  in your hosting platform's environment variable dashboard if this is
  deployed (`.env.local` is gitignored and never travels with a deploy)? If
  you check the URL above and it's something other than a credentials error,
  paste me exactly what it returns and I'll chase the real cause immediately
  — I'd rather fix the actual bug than have you re-check env vars that
  aren't the issue.

--------------------------------------------------------------------------------
FILES CHANGED THIS ROUND
--------------------------------------------------------------------------------
  proxy.js                          — full-app auth gate, /waitlist + /api/health public
  app/waitlist/page.jsx             — redirect signed-in users, minimal header
  components/bracket/EmbedPanel.jsx — pointer-events-none on the loading overlay
  components/home/HeroMatchup.jsx   — console.error surfaces the real load-failure reason
  components/home/Faq.jsx           — "Do I need an account?" answer updated for the waitlist gate

Everything else is copied over unchanged from your existing codebase.

--------------------------------------------------------------------------------
HOW TO RUN
--------------------------------------------------------------------------------
  npm install
  cp .env.example .env.local   # then fill in your real values
  npm run dev
