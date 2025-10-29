import type { NextConfig } from "next";

// Configure outputFileTracingRoot to silence monorepo root inference warnings
const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd().replace(/\\frontend$/, ""),
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
      },
    ],
  },
};

export default nextConfig;
