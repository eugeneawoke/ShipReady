import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteBrandLink } from '@/components/SiteHeader'
import { createServiceClient } from '@/lib/supabase'
import type { ScanResult } from '@/types/scan'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'AI Readiness Ranking — Top Sites for ChatGPT, Claude & Perplexity | Glook',
  description: 'See which sites are best optimized for AI search engines like ChatGPT, Claude, and Perplexity. Live AI readiness leaderboard updated every 6 hours.',
  alternates: { canonical: 'https://shipready.app/ai-readiness-report' },
  openGraph: {
    title: 'AI Readiness Ranking — Glook',
    description: 'Live leaderboard of sites best optimized for ChatGPT, Claude, and Perplexity.',
    url: 'https://shipready.app/ai-readiness-report',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630 }],
  },
}

interface DomainRow {
  slug: string
  domain: string
  ai_readiness_score: number | null
  scans: { results: ScanResult } | null
}

async function fetchLeaderboard(): Promise<DomainRow[]> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('published_domains')
      .select('slug, domain, ai_readiness_score, scans(results)')
      .eq('is_published', true)
      .not('ai_readiness_score', 'is', null)
      .order('ai_readiness_score', { ascending: false })
      .limit(100)
    return (data ?? []) as unknown as DomainRow[]
  } catch {
    return []
  }
}

const PLATFORMS = ['chatgpt', 'claude', 'perplexity', 'googleAI'] as const
const PLATFORM_LABELS: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  perplexity: 'Perplexity',
  googleAI: 'Google AI',
}

export default async function AIReadinessReportPage() {
  const rows = await fetchLeaderboard()

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

      <main className="mx-auto max-w-5xl px-6 py-12 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-[#F1F0EE]">AI Readiness Ranking</h1>
          <p className="mt-2 text-sm text-[#8B8A85]">
            Sites ranked by their readiness to be found, crawled, and cited by AI search engines.
            Updated every 6 hours from verified Glook audits.
          </p>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-xl border border-white/[0.06] bg-[#161618] p-8 text-center text-sm text-[#8B8A85]">
            No published reports yet. Check back soon.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-[#8B8A85]">
                  <th className="pb-3 pr-4 text-left font-medium w-8">#</th>
                  <th className="pb-3 pr-4 text-left font-medium">Domain</th>
                  <th className="pb-3 pr-4 text-right font-medium">AI Score</th>
                  {PLATFORMS.map(p => (
                    <th key={p} className="pb-3 px-2 text-center font-medium hidden sm:table-cell">
                      {PLATFORM_LABELS[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {rows.map((row, i) => {
                  const platforms = row.scans?.results?.aiPlatformReadiness
                  return (
                    <tr key={row.slug} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 pr-4 text-[#5A5955] tabular-nums">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <Link
                          href={`/site/${row.slug}`}
                          className="font-medium text-[#F1F0EE] hover:text-[#6E56CF] transition-colors"
                        >
                          {row.domain}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-right tabular-nums">
                        <span className="font-semibold text-[#6E56CF]">
                          {row.ai_readiness_score !== null ? Math.round(row.ai_readiness_score) : '—'}
                        </span>
                      </td>
                      {PLATFORMS.map(p => {
                        const status = platforms?.[p]
                        return (
                          <td key={p} className="py-3 px-2 text-center hidden sm:table-cell">
                            {status === 'ready' ? (
                              <span className="text-[#3DDC84]">✓</span>
                            ) : status === 'blocked' ? (
                              <span className="text-[#FF4444]">✗</span>
                            ) : status === 'partial' ? (
                              <span className="text-[#F5C518]">~</span>
                            ) : (
                              <span className="text-[#3A3A3E]">—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-xl border border-white/[0.06] bg-[#161618] p-6 text-center">
          <p className="text-sm text-[#8B8A85]">Want to see your site here? Run a free audit.</p>
          <Link
            href="/"
            className="mt-3 inline-block rounded-lg bg-[#6E56CF] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
          >
            Audit your site →
          </Link>
        </div>
      </main>
    </div>
  )
}
