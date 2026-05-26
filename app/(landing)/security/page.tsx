import type { Metadata } from 'next'
import { ScanForm } from '@/components/landing/ScanForm'
import { SiteBrandLink } from '@/components/SiteHeader'
import { LandingNavAuth } from '@/components/landing/LandingNavAuth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Security Audit — ShipReady',
  description: 'Scan your site for security vulnerabilities. Check HTTPS, security headers, exposed .env files, API keys in HTML. Free security audit in 30 seconds.',
  alternates: { canonical: 'https://shipready.app/security' },
  openGraph: {
    title: 'Free Security Audit — ShipReady',
    description: 'Scan your site for security vulnerabilities. Check HTTPS, security headers, exposed .env files, API keys in HTML. Free security audit in 30 seconds.',
    url: 'https://shipready.app/security',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ShipReady — Free Security Audit' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Free Security Audit — ShipReady',
    description: 'Scan your site for security vulnerabilities. Free security audit in 30 seconds.',
    images: ['/opengraph-image'],
  },
}

export default function SecurityLandingPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <header className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <SiteBrandLink />
            <nav className="hidden gap-1 md:flex">
              <Link href="/seo" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">SEO</Link>
              <Link href="/security" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#F1F0EE] bg-white/[0.06]">Security</Link>
              <Link href="/ai-visibility" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">AI Visibility</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">Pricing</Link>
            <LandingNavAuth />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-xs text-orange-400">
          Security Audit
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Is your site<br />actually secure?
        </h1>
        <p className="mb-8 text-lg text-[#8B8A85]">
          Scan for exposed credentials, missing security headers,<br />
          SSL issues, and privacy compliance. Results in 30 seconds.
        </p>
        <ScanForm defaultScanGoal="security" />
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="mb-8 text-center text-lg font-semibold">What the security report covers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Headers & HTTPS', items: ['HTTPS + HSTS', 'CSP policy', 'X-Frame-Options', 'Referrer-Policy'] },
            { title: 'Exposed Secrets', items: ['.env file exposure', 'API keys in HTML', 'Mixed content', 'SSL expiry'] },
            { title: 'Privacy & Legal', items: ['Cookie consent', 'Privacy policy', 'Third-party trackers', 'Permissions-Policy'] },
          ].map((group) => (
            <div key={group.title} className="rounded-xl border border-white/[0.08] p-5">
              <p className="mb-3 font-medium text-[#F1F0EE]">{group.title}</p>
              <ul className="space-y-1.5">
                {group.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#8B8A85]">
                    <span className="text-orange-400">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
