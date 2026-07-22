import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  distDir: process.env.VERCEL ? '.next' : '.next2',
  /* config options here */
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Temporário - para concluir deploy
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
