/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@medhaos/database', '@medhaos/types', '@medhaos/utils'],
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;
