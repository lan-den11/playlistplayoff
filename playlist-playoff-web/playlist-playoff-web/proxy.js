import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { getAppAccessMode } from './lib/posthog-server';

// Always reachable no matter the access mode — the waitlist screen has to
// render even when the mode IS "waitlist-only", and health checks shouldn't
// depend on PostHog being reachable.
const isAlwaysPublicRoute = createRouteMatcher(['/waitlist(.*)', '/api/health']);

// Only the actual gameplay page is ever gated behind sign-in. The homepage
// teaser (HeroMatchup) and the API routes it calls (playlist/user/lastfm)
// stay public in "hero-only" mode on purpose — that's the whole point of
// that mode.
const isGameplayRoute = createRouteMatcher(['/bracket(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAlwaysPublicRoute(req)) return;

  const mode = await getAppAccessMode();

  if (mode === 'waitlist-only') {
    return NextResponse.redirect(new URL('/waitlist', req.url));
  }

  if (mode === 'unlocked') {
    return; // whole app open, no sign-in required anywhere
  }

  // mode === 'hero-only' (the default): homepage/marketing stays public,
  // only the bracket gameplay itself requires sign-in / waitlist approval.
  if (isGameplayRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL('/waitlist', req.url).toString() });
  }
});

export const config = {
  // No `runtime` key needed here: this file is named proxy.js, Next.js 16's
  // renamed convention for what used to be middleware.js, and proxy.js
  // ALWAYS runs on the full Node.js runtime already (declaring `runtime`
  // explicitly is actually a build error — "Proxy always runs on Node.js
  // runtime"). That's exactly what posthog-node needs, so getAppAccessMode()
  // above just works with no extra config.
  matcher: [
    // Skip Next.js internals and static files, unless referenced via a search param
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
