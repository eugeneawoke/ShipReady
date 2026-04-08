import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    'lighthouse',
    'puppeteer-core',
    '@sparticuz/chromium',
    '@paulirish/trace_engine',
    'ssl-checker',
    'cheerio',
  ],
  outputFileTracingIncludes: {
    '/api/report/[id]/pdf': [
      './node_modules/@sparticuz/chromium/bin/**/*',
    ],
  },
};

export default nextConfig;
