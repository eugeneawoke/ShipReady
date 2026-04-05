import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShipReady — Pre-deploy quality gate for vibe-coded apps',
  description: '25+ automated checks in 30 seconds. Performance, SEO, security, and mobile. Get AI fix prompts for Cursor and Bolt.',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} dark h-full`}
    >
      <body className="min-h-full flex flex-col bg-[#0E0E0F] text-[#F1F0EE] antialiased">
        {children}
      </body>
    </html>
  );
}
