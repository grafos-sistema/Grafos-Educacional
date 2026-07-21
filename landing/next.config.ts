import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true, // Para facilitar deploy em diferentes ambientes
  },
  // outputFileTracingRoot para resolver warning de múltiplos lockfiles
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
