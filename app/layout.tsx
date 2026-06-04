import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { headers, cookies } from 'next/headers'
import { MobileBottomDockClient } from '@/components/MobileBottomDockClient'
import { CookieConsentBanner } from '@/components/CookieConsentBanner'
import { AnalyticsGate } from '@/components/AnalyticsGate'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, '')

  const title = 'Glook — Free Website Audit: SEO, AI Visibility & Security'
  const description = 'Find out why Google, ChatGPT, Claude, and Perplexity can\'t find your site. Free SEO, AI visibility, and security audit in 60 seconds.'

  return {
    title,
    description,
    keywords: [
      'free website SEO audit',
      'AI visibility checker',
      'appear in ChatGPT',
      'appear in Claude AI',
      'get found on Perplexity',
      'generative engine optimization',
      'AEO optimization',
      'website security check free',
      'website audit tool',
      'Google AI Overview optimization',
    ],
    openGraph: {
      title: 'Glook — Free Website Audit',
      description,
      siteName: 'Glook',
      url: `${appUrl}/`,
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Glook — Free Website Audit: SEO, AI Visibility & Security' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Glook — Free Website Audit',
      description,
      images: ['/opengraph-image'],
    },
    icons: {
      icon: '/favicon.svg',
      apple: '/logo.svg',
    },
    manifest: '/manifest.json',
    metadataBase: new URL(appUrl),
    alternates: { canonical: `${appUrl}/` },
  }
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Glook',
  url: (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, ''),
  logo: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, '')}/logo.svg`,
  description: 'Free website audit tool. Find out why your site is not showing up in Google, ChatGPT, Claude, or Perplexity — and get the exact fix.',
  sameAs: [
    'https://x.com/eugenegusakov',
    'https://github.com/eugeneawoke',
    'https://www.linkedin.com/in/eugene-gusakov/',
  ],
}

const deployTimestamp = process.env.VERCEL_GIT_COMMIT_TIMESTAMP
  ? new Date(parseInt(process.env.VERCEL_GIT_COMMIT_TIMESTAMP) * 1000).toISOString().split('T')[0]
  : new Date().toISOString().split('T')[0]

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Glook',
  url: (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, ''),
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  datePublished: '2025-05-01',
  dateModified: deployTimestamp,
  description: 'Free website audit. Find out why your site isn\'t showing up in Google, ChatGPT, Claude, or Perplexity — and fix it. SEO, AI visibility, and security in 30 seconds.',
  featureList: [
    'Lighthouse performance audit',
    'SEO metadata and structured data check',
    'HTTP security header scan',
    'Mobile readiness audit',
    'GEO (Generative Engine Optimization) audit',
    'AEO (Answer Engine Optimization) audit',
    'AI visibility check — llms.txt, ChatGPT/Claude/Perplexity crawler access, FAQ schema, author entity',
    'Organization sameAs entity check',
    'Content date freshness signal',
    'Answer-first paragraph structure check',
    'OG image dimensions validation',
    'Evidence-based verified/likely/heuristic confidence model',
    'AI fix prompts for any AI coding tool',
  ],
  offers: [
    { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: '3 scans per month. All category scores and issue descriptions.' },
    { '@type': 'Offer', name: 'Pro', price: '14', priceCurrency: 'USD', description: 'Unlimited scans, AI fix prompts, PDF export, weekly monitoring.' },
    { '@type': 'Offer', name: 'Agency', price: '39', priceCurrency: 'USD', description: '10 domains, white-label PDF, all Pro features, priority support.' },
  ],
}

const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, '')
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Glook',
  url: base,
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${base}/?url={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()
  const nonce = (await headers()).get('x-nonce') ?? undefined
  const cookieStore = await cookies()
  const consentCookie = cookieStore.get('glook-consent')?.value ?? null

  return (
    <html
      lang={locale}
      className={`${GeistSans.variable} ${GeistMono.variable} dark h-full`}
      suppressHydrationWarning
    >
      <head>
        {/* Sitemap link — lets AI/SEO scanners find /sitemap.xml from HTML without HTTP probe */}
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <script
          nonce={nonce}
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body
        className="min-h-full flex flex-col bg-[#0E0E0F] text-[#F1F0EE] antialiased"
        suppressHydrationWarning
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-black"
        >
          Skip to main content
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <MobileBottomDockClient />
          <CookieConsentBanner initialConsent={consentCookie} />
        </NextIntlClientProvider>
        <AnalyticsGate />
        <SpeedInsights />
      </body>
    </html>
  )
}
