/** @type {import('next').NextConfig} */
const nextConfig = {
  // API routes live in this same app under app/api/**, so there's no
  // separate origin to rewrite/proxy to.
  experimental: {
    // Tree-shakes these to only the icons/modules actually imported instead
    // of pulling in the whole package per route — smaller JS bundles,
    // faster first load (especially on mobile).
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
};

module.exports = nextConfig;
