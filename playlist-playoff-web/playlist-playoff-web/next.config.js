/** @type {import('next').NextConfig} */
const nextConfig = {
  // Nothing custom needed anymore — API routes live in this same app under
  // app/api/**, so there's no separate origin to rewrite/proxy to. This file
  // only exists because Next.js expects to find one; it's fine empty.
};

module.exports = nextConfig;
