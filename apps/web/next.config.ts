import type { NextConfig } from 'next';
// @ts-expect-error -- next-pwa has no type declarations
import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  customWorkerDir: 'worker',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
};

export default withPWA(nextConfig);
