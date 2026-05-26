import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { ScoreRing } from '@/components/report/ScoreRing'
import { CategoryCard } from '@/components/report/CategoryCard'
import { SecurityAlertBanner } from '@/components/report/SecurityAlertBanner'
import { SiteBrandLink } from '@/components/SiteHeader'
import type { ScanResult, IssueCategory } from '@/types/scan'

export const revalidate = 3600

const CATEGORY_ORDER: IssueCategory[] = [
  'performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility',
]

interface Props {
  params: Promise<{ domain: string }>
}

async function fetchDomainReport(slug: string) {
  const supabase = createServiceClient()

  const { data: row, error } = await supabase
    .from('published_domains')
    .select('*, scans(results, url, created_at)')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error || !row) return null

  const scanResults = (row as { scans?: { results: ScanResult; url: string; created_at: string } })?.scans
  return { row, scanResults }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { domain } = await params
  const data = await fetchDomainReport(domain)
  if (!data) return { title: 'Not Found — ShipReady' }

  const { row } = data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app'

  return {
    title: row.title ?? `${row.domain} — Site Audit | ShipReady`,
    description: row.description ?? `Full website audit for ${row.domain}: SEO, security, performance, and AI visibility.`,
    alternates: { canonical: `${appUrl}/site/${domain}` },
    openGraph: {
      title: row.title ?? `${row.domain} — Site Audit`,
      description: row.description ?? `Full website audit for ${row.domain}.`,
      url: `${appUrl}/site/${domain}`,
      type: 'website',
      images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
    },
    robots: { index: true, follow: true },
  }
}

export default async function PublicDomainPage({ params }: Props) {
  const { domain } = await params
  const data = await fetchDomainReport(domain)

  if (!data || !data.scanResults) notFound()

  const { row, scanResults } = data
  const results = scanResults.results

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <header className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <SiteBrandLink />
          <Link
            href="/"
            className="rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
          >
            Audit your site →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        {/* Domain header */}
        <div className="flex items-start gap-6">
          <ScoreRing score={results.totalScore ?? null} size={80} />
          <div>
            <h1 className="text-2xl font-semibold text-[#F1F0EE]">{row.domain}</h1>
            <p className="mt-1 text-sm text-[#8B8A85]">
              Scanned {new Date(scanResults.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            {results.aiSummary && (
              <p className="mt-3 max-w-2xl text-sm text-[#C9C8C3] leading-relaxed">{results.aiSummary}</p>
            )}
          </div>
        </div>

        {/* Critical security issues banner */}
        <SecurityAlertBanner result={results} />

        {/* Category cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_ORDER.map(cat => {
            const catData = results[cat]
            if (!catData) return null
            return <CategoryCard key={cat} category={cat} data={catData} />
          })}
        </div>

        {/* CTA */}
        <div className="rounded-xl border border-white/[0.06] bg-[#161618] p-6 text-center">
          <p className="text-sm text-[#8B8A85]">Want to audit your own site?</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-lg bg-[#6E56CF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
          >
            Run a free audit →
          </Link>
        </div>
      </main>
    </div>
  )
}
