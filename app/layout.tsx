import type { Metadata } from 'next'
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { LanguageSync } from '@/components/i18n/LanguageSync'
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

  return {
    title: t('layoutTitle'),
    description: t('layoutDescription'),
    keywords: ['web quality', 'lighthouse', 'SEO checker', 'security audit', 'vibe coding', 'cursor', 'windsurf', 'bolt', 'lovable', 'v0', 'replit'],
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
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'),
  }
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
      <body className="min-h-full flex flex-col bg-[#0E0E0F] text-[#F1F0EE] antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <LanguageSync />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
