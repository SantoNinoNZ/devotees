import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/devotees',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
