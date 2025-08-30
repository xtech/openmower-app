import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ['@mapbox/mapbox-gl-draw', 'mapbox-gl-draw-split-polygon-mode', 'apbox-gl-draw-passing-mode'],
};

export default nextConfig;
