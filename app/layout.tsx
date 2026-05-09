import type { Metadata } from 'next'
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { headers } from 'next/headers'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '600', '700'],
  adjustFontFallback: true,
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['400', '500', '600'],
  adjustFontFallback: true,
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
  adjustFontFallback: true,
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'

  return {
    title: t('layoutTitle'),
    description: t('layoutDescription'),
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
    alternates: {
      canonical: appUrl,
    },
    openGraph: {
      title: t('appTitle'),
      description: t('appDescription'),
      siteName: t('appTitle'),
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ShipReady — Free Website Audit: SEO, AI Visibility & Security' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('appTitle'),
      description: t('appDescription'),
      images: ['/opengraph-image'],
    },
    icons: {
      apple: '/logo.svg',
    },
    metadataBase: new URL(appUrl),
  }
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'ShipReady',
  url: (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, ''),
  logo: `${(process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')}/logo.svg`,
  description: 'Free website audit tool. Find out why your site is not showing up in Google, ChatGPT, Claude, or Perplexity — and get the exact fix.',
  sameAs: [] as string[],
}

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShipReady',
  url: (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, ''),
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
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

const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
const webSiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'ShipReady',
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

  return (
    <html
      lang={locale}
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
        />
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#0E0E0F] text-[#F1F0EE] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
