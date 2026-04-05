import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShipReady',
  description: 'Pre-deploy quality gate for vibe-coded apps',
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
