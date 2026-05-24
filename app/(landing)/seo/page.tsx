import type { Metadata } from 'next'
import { ScanForm } from '@/components/landing/ScanForm'
import { SiteBrandLink } from '@/components/SiteHeader'
import { LandingNavAuth } from '@/components/landing/LandingNavAuth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SEO Audit — ShipReady',
  description: 'Find out why Google can\'t find your site. Check Core Web Vitals, indexability, structured data, and canonical issues. Free SEO audit in 60 seconds.',
}

export default function SeoLandingPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Header */}
      <header className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <SiteBrandLink />
            <nav className="hidden gap-1 md:flex">
              <Link href="/seo" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#F1F0EE] bg-white/[0.06]">SEO</Link>
              <Link href="/security" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">Security</Link>
              <Link href="/ai-visibility" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">AI Visibility</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">Pricing</Link>
            <LandingNavAuth />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs text-blue-400">
          SEO Audit
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Why isn&apos;t your site<br />showing on Google?
        </h1>
        <p className="mb-8 text-lg text-[#8B8A85]">
          Paste your URL. Find out exactly what&apos;s blocking your ranking.<br />
          Core Web Vitals, indexability, structured data — verified in 60 seconds.
        </p>
        <ScanForm defaultScanGoal="seo" />
      </section>

      {/* What we check */}
      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="mb-8 text-center text-lg font-semibold">What the SEO report covers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Indexability', items: ['robots.txt rules', 'Canonical tags', 'noindex directives', 'Sitemap'] },
            { title: 'Performance', items: ['Core Web Vitals (LCP/CLS/INP)', 'Page speed score', 'Render-blocking resources', 'SPA/SSR detection'] },
            { title: 'On-page SEO', items: ['Title & meta description', 'H1 structure', 'Structured data', 'Internal linking'] },
          ].map((group) => (
            <div key={group.title} className="rounded-xl border border-white/[0.08] p-5">
              <p className="mb-3 font-medium text-[#F1F0EE]">{group.title}</p>
              <ul className="space-y-1.5">
                {group.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#8B8A85]">
                    <span className="text-[#6E56CF]">✓</span>
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
