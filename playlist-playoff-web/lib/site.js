// Canonical public origin — used for metadataBase (share/OG URLs), robots and
// the sitemap. Set NEXT_PUBLIC_SITE_URL in the hosting env; Vercel's
// production URL is the automatic fallback, localhost the last resort.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')
).replace(/\/$/, '');
