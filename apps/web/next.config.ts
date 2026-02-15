import type { NextConfig } from 'next';
// @ts-expect-error -- next-pwa has no type declarations
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
  disable: process.env.NODE_ENV === 'development',
  navigationPreload: false,
  runtimeCaching: [
    // Navigation requests - let App Router handle routing
    {
      urlPattern: ({ request }: { request: Request }) => request.mode === 'navigate',
      handler: 'NetworkOnly',
    },
    // Next.js static files - cache first
    {
      urlPattern: /\/_next\/static\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Images - stale while revalidate
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // API requests - network first
    {
      urlPattern: /\/api\//,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
