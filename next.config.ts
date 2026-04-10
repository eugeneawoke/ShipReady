import createNextIntlPlugin from 'next-intl/plugin'
import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
    ].join(', '),
  },
  // CSP is set per-request in middleware.ts with a nonce (no unsafe-inline in script-src)
]

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
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl(nextConfig);
