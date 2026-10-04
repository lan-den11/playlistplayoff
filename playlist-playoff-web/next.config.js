const posthogHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com').replace(/\/$/, '');
const posthogAssetsHost = posthogHost.replace('.i.posthog.com', '-assets.i.posthog.com');

function clerkFrontendOrigin() {
  try {
    const encoded = (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '').split('_')[2];
    if (!encoded) return null;
    const host = Buffer.from(encoded, 'base64').toString('utf8').replace(/\$$/, '');
    return /^[a-z0-9.-]+$/i.test(host) ? `https://${host}` : null;
  } catch {
    return null;
  }
}

const clerkSources = ['https://*.clerk.accounts.dev', 'https://*.clerk.com', clerkFrontendOrigin()].filter(Boolean).join(' ');

const enforcedCsp = ["frame-ancestors 'none'", "base-uri 'self'", "object-src 'none'"].join('; ');

const reportOnlyCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://open.spotify.com https://challenges.cloudflare.com ${clerkSources}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.scdn.co https://*.spotifycdn.com https://img.clerk.com",
  "font-src 'self' data:",
  `connect-src 'self' ${clerkSources} https://challenges.cloudflare.com https://clerk-telemetry.com`,
  `frame-src https://open.spotify.com https://challenges.cloudflare.com ${clerkSources}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: enforcedCsp },
  { key: 'Content-Security-Policy-Report-Only', value: reportOnlyCsp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
];

const socialRedirects = [
  ['ig', 'instagram'],
  ['tiktok', 'tiktok'],
  ['yt', 'youtube'],
  ['reddit', 'reddit'],
  ['threads', 'threads'],
].map(([path, source]) => ({
  source: `/${path}`,
  destination: `/?utm_source=${source}&utm_medium=social&utm_campaign=bio`,
  permanent: false,
}));

const nextConfig = {
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  skipTrailingSlashRedirect: true,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return socialRedirects;
  },
  async rewrites() {
    return [
      { source: '/ingest/static/:path*', destination: `${posthogAssetsHost}/static/:path*` },
      { source: '/ingest/array/:path*', destination: `${posthogAssetsHost}/array/:path*` },
      { source: '/ingest/:path*', destination: `${posthogHost}/:path*` },
    ];
  },
};

module.exports = nextConfig;
