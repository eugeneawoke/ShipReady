import type { Metadata } from 'next'
import { ScanForm } from '@/components/landing/ScanForm'
import { SiteBrandLink } from '@/components/SiteHeader'
import { LandingNavAuth } from '@/components/landing/LandingNavAuth'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'AI Visibility Audit — Glook',
  description: 'Check if ChatGPT, Claude, and Perplexity can find and cite your site. Generate llms.txt, schema.org markup, and FAQ structured data instantly.',
  alternates: { canonical: 'https://shipready.app/ai-visibility' },
  openGraph: {
    title: 'AI Visibility Audit — Glook',
    description: 'Check if ChatGPT, Claude, and Perplexity can find and cite your site. Generate llms.txt, schema.org markup, and FAQ structured data instantly.',
    url: 'https://shipready.app/ai-visibility',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Glook — AI Visibility Audit' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Visibility Audit — Glook',
    description: 'Check if ChatGPT, Claude, and Perplexity can find and cite your site.',
    images: ['/opengraph-image'],
  },
}

export default function AIVisibilityLandingPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <header className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <SiteBrandLink />
            <nav className="hidden gap-1 md:flex">
              <Link href="/seo" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">SEO</Link>
              <Link href="/security" className="rounded-lg px-3 py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">Security</Link>
              <Link href="/ai-visibility" className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#F1F0EE] bg-white/[0.06]">AI Visibility</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/pricing" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">Pricing</Link>
            <LandingNavAuth />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs text-violet-400">
          AI Visibility Audit
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
          Does ChatGPT<br />know you exist?
        </h1>
        <p className="mb-8 text-lg text-[#8B8A85]">
          Find out if ChatGPT, Claude, and Perplexity can read and cite your site.<br />
          Get a ready-to-use llms.txt, schema markup, and AI-optimized fix guide.
        </p>
        <ScanForm defaultScanGoal="ai_visibility" />
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <h2 className="mb-8 text-center text-lg font-semibold">What the AI readiness report covers</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: 'Crawler Access', items: ['GPTBot (ChatGPT)', 'ClaudeBot (Claude)', 'PerplexityBot', 'robots.txt per-bot rules'] },
            { title: 'Structured Data', items: ['Schema.org markup', 'FAQ schema', 'Organization entity', 'Author signals'] },
            { title: 'Generated for You', items: ['Ready-to-paste llms.txt', 'JSON-LD schema snippet', 'GEO-optimized headings', 'Answer-first paragraph'] },
          ].map((group) => (
            <div key={group.title} className="rounded-xl border border-white/[0.08] p-5">
              <p className="mb-3 font-medium text-[#F1F0EE]">{group.title}</p>
              <ul className="space-y-1.5">
                {group.items.map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#8B8A85]">
                    <span className="text-violet-400">✓</span>
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
