import { createServiceClient } from '@/lib/supabase'
import type { IssueCategory, ScanResult } from '@/types/scan'

export interface CategoryStats {
  slug: string
  category: IssueCategory | null
  avgScore: number | null
  passRate: number | null
  totalDomains: number
  commonIssueIds: string[]
}

const SLUG_TO_CATEGORY: Record<string, IssueCategory | null> = {
  performance: 'performance',
  seo: 'seo',
  security: 'security',
  mobile: 'mobile',
  'ai-visibility': 'ai_visibility',
  accessibility: 'accessibility',
  lcp: 'performance',
  'csp-headers': 'security',
  'llms-txt': 'ai_visibility',
  'structured-data': 'seo',
}

const SLUG_ISSUE_FILTER: Record<string, string[]> = {
  lcp: ['lcp-slow', 'lcp-missing'],
  'csp-headers': ['csp-missing', 'csp-report-only'],
  'llms-txt': ['no-llms-txt', 'llms-txt-invalid'],
  'structured-data': ['no-schema', 'schema-missing-required'],
}

export async function getCategoryStats(slug: string): Promise<CategoryStats> {
  const category = SLUG_TO_CATEGORY[slug] ?? null
  const issueFilter = SLUG_ISSUE_FILTER[slug] ?? null

  const empty: CategoryStats = { slug, category, avgScore: null, passRate: null, totalDomains: 0, commonIssueIds: [] }

  try {
    const supabase = createServiceClient()
    const { data: rows } = await supabase
      .from('published_domains')
      .select('scans(results)')
      .eq('is_published', true)

    if (!rows || rows.length === 0) return empty

    type Row = { scans?: { results: ScanResult }[] | null }
    const scans = (rows as unknown as Row[])
      .flatMap(r => r.scans ?? [])
      .map(s => s.results)
      .filter((r): r is ScanResult => !!r)

    if (scans.length === 0) return empty

    const scores: number[] = []
    let passes = 0
    const issueCounts: Record<string, number> = {}

    for (const result of scans) {
      const catData = category ? result[category] : null
      if (catData) {
        if (typeof catData.score === 'number') scores.push(catData.score)
        if (catData.score !== null && catData.score >= 80) passes++
        for (const issue of catData.issues ?? []) {
          if (!issueFilter || issueFilter.includes(issue.id)) {
            issueCounts[issue.id] = (issueCounts[issue.id] ?? 0) + 1
          }
        }
      }
    }

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    const passRate = scores.length > 0 ? (passes / scores.length) * 100 : null
    const commonIssueIds = Object.entries(issueCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id)

    return { slug, category, avgScore, passRate, totalDomains: scans.length, commonIssueIds }
  } catch {
    return empty
  }
}
