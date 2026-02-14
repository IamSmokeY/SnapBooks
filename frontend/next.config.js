/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ['@/components'],
  },

  images: {
    domains: [],
  },
};

module.exports = nextConfig;
