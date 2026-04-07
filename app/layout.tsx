import type { Metadata } from 'next'
import { Syne, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'ShipReady — Pre-deploy quality gate for vibe-coded apps',
  description: '40+ automated checks in 30 seconds. Performance, SEO, security, and mobile. Get AI fix prompts for Cursor and Bolt.',
  keywords: ['web quality', 'lighthouse', 'SEO checker', 'security audit', 'vibe coding', 'cursor', 'bolt'],
  openGraph: {
    title: 'ShipReady',
    description: 'Pre-deploy quality gate for vibe-coded apps',
    siteName: 'ShipReady',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ShipReady',
    description: 'Pre-deploy quality gate for vibe-coded apps',
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'),
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#0E0E0F] text-[#F1F0EE] antialiased">
        {children}
      </body>
    </html>
  )
}
