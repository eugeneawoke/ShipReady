import type { Metadata } from 'next'
import Link from 'next/link'
import { competitors, competitorSlugs } from '@/lib/vs/competitors'
import { ContentPageHeader } from '@/components/navigation/ContentPageHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export const revalidate = 86400 // 24h

export const metadata: Metadata = {
  title: 'ShipReady Alternatives & Comparisons — 2026',
  description: 'Compare ShipReady against leading SEO and site audit tools. See how ShipReady stacks up on AI visibility, security audits, pricing, and ease of use.',
}

export default async function VsIndexPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <ContentPageHeader />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">Compare</p>
        <h1 className="text-[28px] sm:text-[36px] font-medium tracking-tight mb-3">
          ShipReady vs the alternatives
        </h1>
        <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg mb-12">
          See how ShipReady compares to popular SEO and site audit tools — especially on AI visibility, security audits, and pricing.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {competitorSlugs.map(slug => {
            const c = competitors[slug]
            return (
              <Link
                key={slug}
                href={`/vs/${slug}`}
                className="group p-5 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 hover:bg-[#6E56CF]/[0.04] transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-medium text-base">ShipReady vs {c.name}</h2>
                  <span className="text-[#5A5955] group-hover:text-[#6E56CF] transition-colors text-sm">→</span>
                </div>
                <p className="text-xs text-[#5A5955] leading-relaxed mb-3">{c.tagline}</p>
                <p className="text-[10px] font-mono text-[#6E56CF]">{c.pricingRange}</p>
              </Link>
            )
          })}
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
