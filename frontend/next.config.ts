import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async rewrites() {
    // INTERNAL_API_URL is the Docker-internal address used by the Next.js
    // server for proxying; NEXT_PUBLIC_API_URL is the browser-facing URL.
    const dest =
      process.env.INTERNAL_API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3003/api';
    return [
      {
        source: '/api/:path*',
        destination: `${dest}/:path*`,
      },
    ];
  },
};

export default nextConfig;
