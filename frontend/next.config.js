/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@/components'],
  },

  // Configure image domains if needed
  images: {
    domains: [],
  },

  // Webpack configuration for Puppeteer (if needed)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Puppeteer specific configuration
      config.externals = [...(config.externals || []), 'puppeteer'];
    }
    return config;
  },
};

module.exports = nextConfig;
