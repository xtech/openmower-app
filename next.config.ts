import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@mapbox/mapbox-gl-draw', 'mqtt'],
};

export default nextConfig;
