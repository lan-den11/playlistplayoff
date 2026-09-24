// Canonical public origin — used for metadataBase (share/OG URLs), robots,
// the sitemap, and the "try it yourself" link on shared result cards. Set
// NEXT_PUBLIC_SITE_URL once a real domain exists; until then this falls back
// to the Render URL so share links/copy always point somewhere real instead
// of localhost.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  'https://playlistplayoff.onrender.com'
).replace(/\/$/, '');

// Same value without the protocol, for compact display text ("try it at
// playlistplayoff.onrender.com" rather than the full https:// URL).
export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
