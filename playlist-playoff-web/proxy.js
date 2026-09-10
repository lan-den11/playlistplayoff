import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// FULL-APP WAITLIST GATE (this round). Before this, `waitlistUrl` on
// <ClerkProvider> only ever affected Clerk's OWN sign-up modal — the
// homepage, the live Hero teaser, and the entire /bracket experience were
// all fully playable by anyone with zero account at all. Per the ask ("the
// whole app in waitlist including the bracket, everything"), every route
// now requires a signed-in session. The only page anyone can reach without
// one is /waitlist itself.
//
// `/api/health` is deliberately left public too — it's not a product
// surface, it's what most hosting platforms (Railway, Fly, Render, etc.)
// ping unauthenticated to confirm the app is alive. Gating it would make a
// perfectly healthy deployment look "down" to your host's monitoring and
// risk it cycling the instance.
const isPublicRoute = createRouteMatcher(['/waitlist(.*)', '/api/health']);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;
  // unauthenticatedUrl sends signed-out visitors straight to our own styled
  // /waitlist page instead of Clerk's default hosted sign-in — same
  // destination the sign-in modal already redirects to once Clerk's
  // Waitlist restriction is switched on in the Dashboard.
  await auth.protect({ unauthenticatedUrl: new URL('/waitlist', req.url).toString() });
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless referenced via a search param
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
