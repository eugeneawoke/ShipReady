import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { competitors, competitorSlugs } from '@/lib/vs/competitors'
import { CompetitorTable } from '@/components/vs/CompetitorTable'
import { CompetitorFaq } from '@/components/vs/CompetitorFaq'
import { CompetitorWins } from '@/components/vs/CompetitorWins'
import { RelatedComparisons } from '@/components/vs/RelatedComparisons'
import { ContentPageHeader } from '@/components/navigation/ContentPageHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export const revalidate = 86400 // 24h

export async function generateStaticParams() {
  return competitorSlugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const c = competitors[slug]
  if (!c) return {}

  const year = new Date().getFullYear()
  return {
    title: `Glook vs ${c.name} — ${year} Comparison`,
    description: `Compare Glook and ${c.name} across AI visibility, security, SEO auditing, and pricing. See which tool fits your workflow.`,
    alternates: {
      canonical: `/vs/${slug}`,
    },
  }
}

export default async function VsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const c = competitors[slug]
  if (!c) notFound()

  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <ContentPageHeader />

      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/vs" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">
            ← All comparisons
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-12">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">Compare · {year}</p>
          <h1 className="text-[28px] sm:text-[40px] font-semibold tracking-tight mb-4">
            Glook vs {c.name}
          </h1>
          <p className="text-[#8B8A85] text-sm leading-relaxed max-w-xl mb-6">
            {c.tagline}
          </p>
          <div className="inline-flex items-center gap-3 p-4 rounded-xl bg-[#6E56CF]/[0.08] border border-[#6E56CF]/20">
            <span className="text-[#6E56CF] text-lg">⬡</span>
            <p className="text-sm text-[#C9C8C3] leading-relaxed">{c.verdict}</p>
          </div>
        </div>

        {/* Price comparison */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="p-5 rounded-xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/20 text-center">
            <p className="text-[10px] font-mono text-[#6E56CF] uppercase tracking-widest mb-2">Glook</p>
            <p className="text-2xl font-bold text-[#F1F0EE]">$14<span className="text-sm font-normal text-[#8B8A85]">/mo</span></p>
            <p className="text-[11px] text-[#5A5955] mt-1">Free tier — no credit card</p>
          </div>
          <div className="p-5 rounded-xl bg-[#161618] border border-white/[0.06] text-center">
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">{c.name}</p>
            <p className="text-2xl font-bold text-[#8B8A85]">{c.pricingRange}</p>
            <p className="text-[11px] text-[#3A3A3A] mt-1">Paid plans only</p>
          </div>
        </div>

        {/* Why Glook wins */}
        <CompetitorWins wins={c.whyWins} competitorName={c.name} />

        {/* Feature comparison table */}
        <div className="mb-12">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-5">
            Feature comparison
          </h2>
          <CompetitorTable features={c.features} competitorName={c.name} />
        </div>

        {/* Mid-page CTA */}
        <div className="mb-12 rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#F1F0EE] mb-1">Try Glook free</p>
            <p className="text-xs text-[#8B8A85]">No credit card required. Full report in under a minute.</p>
          </div>
          <Link
            href="/"
            className="shrink-0 inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            Scan your site →
          </Link>
        </div>

        {/* Weaknesses */}
        <div className="mb-12 p-6 rounded-2xl bg-[#161618] border border-white/[0.06]">
          <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">
            What {c.name} doesn&apos;t cover
          </h2>
          <ul className="space-y-2">
            {c.weaknesses.map(w => (
              <li key={w} className="flex items-start gap-2 text-sm text-[#8B8A85]">
                <span className="text-[#FF4444] mt-0.5 shrink-0">⚠</span>
                {w}
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <CompetitorFaq items={c.faq} competitorName={c.name} />
        </div>

        {/* Related comparisons */}
        <RelatedComparisons currentSlug={slug} />

        {/* CTA */}
        <div className="rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 p-10 text-center">
          <p className="text-[11px] font-mono text-[#6E56CF] uppercase tracking-widest mb-3">Get started</p>
          <h2 className="text-xl font-semibold tracking-tight mb-2">Try Glook free</h2>
          <p className="text-[#8B8A85] text-sm mb-6 max-w-sm mx-auto">
            No credit card required. Scan your site and get a full AI visibility, security, and SEO report in under a minute.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            Try Glook free — no credit card →
          </Link>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
