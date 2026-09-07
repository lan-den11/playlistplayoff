PLAYLIST PLAYOFF — UI FIX + HERO-TO-BRACKET HANDOFF
=====================================================

HOW TO APPLY
-------------
Unzip this at the same level as your existing `playlist-playoff-web/`
folder (i.e. one directory above it) and let it overwrite. Every file in
here is a complete replacement, not a diff.

ONE MANUAL STEP — DELETE A FILE
---------------------------------
Delete this file, it's no longer used:

    playlist-playoff-web/app/api/trending/route.js

(From an earlier round of this conversation. The hero teaser now loads
Spotify's Top 50 Global playlist through the same /api/playlist/[idOrUrl]/
tracks route a pasted-in playlist uses, instead of a separate endpoint. A
zip can only add/overwrite files, not delete stray ones, so this has to be
removed by hand.)

WHAT CHANGED
-------------
1. Fixed the stuck "Round of 64" intro + spinner bug in BattleScreen.jsx —
   one useEffect was doing three unrelated jobs off a shared dependency
   array; split into three independent effects.
2. Logo in Navbar.jsx and BracketHeader.jsx now links home via next/link.
3. Consolidated the color system: violet→indigo (brand/primary), teal→cyan
   (battle "vs" mechanic only), amber→orange (champion + "coming soon"
   only). Removed the unused five-hue palette.
4. Hero.jsx now runs a REAL 8-song bracket (via the same useBracket hook
   the full app uses) seeded from Spotify's live Top 50 Global playlist.
   After 5 real picks, it hands off to /bracket?from=trending, which
   detects the query param and resumes that exact bracket via the existing
   ResumeModal — same engine, same state, no duplicated logic.
5. useBracket.js now accepts an optional storageKey so the homepage
   teaser's autosave can never overwrite a real in-progress bracket someone
   saved by pasting their own playlist.

NO NEW ENV VARS
-----------------
Everything reuses SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET you already
have configured for playlist loading. If those aren't set, the hero
gracefully falls back to a static non-interactive preview card instead of
breaking.
