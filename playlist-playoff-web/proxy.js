// Next.js 16 renamed this file from middleware.js to proxy.js (same
// behavior, Node.js runtime by default now instead of Edge). clerkMiddleware()
// still works unchanged — Next 16 just requires a default export (or one
// named `proxy`), and this already is one.
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files, unless referenced via a search param
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
