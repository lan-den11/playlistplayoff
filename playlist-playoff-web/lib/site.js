export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) ||
  'https://playlistplayoff.onrender.com'
).replace(/\/$/, '');

export const SITE_HOST = SITE_URL.replace(/^https?:\/\//, '');
