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
};

export default nextConfig;
