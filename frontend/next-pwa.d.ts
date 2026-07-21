declare module 'next-pwa' {
  import { NextConfig } from 'next';

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    sw?: string;
    publicExcludes?: string[];
    buildExcludes?: RegExp[];
  }

  export default function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
