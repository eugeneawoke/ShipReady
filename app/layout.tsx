import type { Metadata } from 'next'
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import './globals.css'

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'

  return {
    title: t('layoutTitle'),
    description: t('layoutDescription'),
    keywords: ['web quality', 'lighthouse', 'SEO checker', 'security audit', 'vibe coding', 'cursor', 'windsurf', 'bolt', 'lovable', 'v0', 'replit'],
    alternates: {
      canonical: appUrl,
    },
    openGraph: {
      title: t('appTitle'),
      description: t('appDescription'),
      siteName: t('appTitle'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('appTitle'),
      description: t('appDescription'),
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
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app',
  logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'}/logo.svg`,
  description: 'Pre-deploy quality gate for vibe-coded apps. Scans performance, SEO, security, mobile readiness, and AI visibility.',
}

const webApplicationSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'ShipReady',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app',
  applicationCategory: 'DeveloperApplication',
  description: 'Pre-deploy quality gate for vibe-coded apps. Scans performance, SEO, security, mobile readiness, and AI visibility.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html
      lang={locale}
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationSchema) }}
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
