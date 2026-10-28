import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // Standalone output is only used by the Docker image (Linux). On Windows it fails to copy
  // Turbopack chunks named after `node:` built-ins (":" is not allowed in Windows file names).
  output: process.platform === 'win32' ? undefined : 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Browsers must always re-check the service worker so updates roll out.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
