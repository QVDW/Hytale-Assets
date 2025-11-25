import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  experimental: {
    // Updated from serverComponentsExternalPackages to serverExternalPackages
  },
  // Proper configuration for server external packages
  serverExternalPackages: [],
  // Configure TypeScript properly
  typescript: {
    ignoreBuildErrors: true,
  },
  // Ensure error pages are properly generated
  async redirects() {
    return [];
  },
  async headers() {
    return [];
  },
  output: 'standalone',
  // Add proper image configuration
  images: {
    domains: ['65.109.15.138', 'localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '65.109.15.138',
        port: '3000',
        pathname: '/uploads/**',
      },
    ],
  },
  // Ensure static files are properly served
  staticPageGenerationTimeout: 180,
};

export default nextConfig;
