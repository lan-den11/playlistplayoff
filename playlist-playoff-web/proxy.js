import { NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { getAppAccessMode } from './lib/posthog-server';

// Crawler/social-preview endpoints must stay reachable in every access mode —
// otherwise `waitlist-only` would redirect robots.txt and the share image to
// /waitlist and link previews would break.
const isAlwaysPublicRoute = createRouteMatcher([
  '/waitlist(.*)',
  '/api/health',
  '/api/debug(.*)',
  '/robots.txt',
  '/sitemap.xml',
  '/opengraph-image(.*)',
  '/twitter-image(.*)',
]);
const isGameplayRoute = createRouteMatcher(['/bracket(.*)']);

export default clerkMiddleware(async (auth, req) => {
  if (isAlwaysPublicRoute(req)) return;

  const mode = await getAppAccessMode();

  if (mode === 'waitlist-only') {
    return NextResponse.redirect(new URL('/waitlist', req.url));
  }

  if (mode === 'unlocked') {
    return;
  }

  if (isGameplayRoute(req)) {
    await auth.protect({ unauthenticatedUrl: new URL('/waitlist', req.url).toString() });
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
