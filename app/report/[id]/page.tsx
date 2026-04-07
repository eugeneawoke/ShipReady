'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Share2 } from 'lucide-react'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import { ScoreRing } from '@/components/report/ScoreRing'
import { CategoryCard } from '@/components/report/CategoryCard'
import { IssueCard } from '@/components/report/IssueCard'
import { OGPreview } from '@/components/report/OGPreview'
import type { Scan, Issue, IssueCategory } from '@/types/scan'

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  pass: 4,
}

const CATEGORIES: IssueCategory[] = ['performance', 'seo', 'security', 'mobile', 'ai_visibility']
const CATEGORY_LABELS: Record<IssueCategory, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [id, setId] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<IssueCategory>('performance')
  const [passedOpen, setPassedOpen] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share')

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    if (!id) return

    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout

    async function poll() {
      const res = await fetch(`/api/scan/${id}`)
      if (!res.ok) return
      const data = await res.json()
      setScan(data)
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(interval)
      }
    }

    poll()
    interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [id])

  if (!scan || scan.status === 'pending' || scan.status === 'running') {
    return <ReportSkeleton status={scan?.status ?? 'pending'} />
  }

  if (scan.status === 'error' || !scan.results) {
    return <ReportSkeleton status="error" />
  }

  const { results } = scan

  // Gather all non-pass issues sorted by severity
  const allIssues: Issue[] = CATEGORIES.flatMap(cat => results[cat].issues).sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  )

  const activeIssues = allIssues.filter(i => i.severity !== 'pass')
  const passedIssues = allIssues.filter(i => i.severity === 'pass')
  const totalPassed = CATEGORIES.reduce((sum, cat) => sum + results[cat].passedChecks, 0)

  // Extract domain for OGPreview
  let domain = scan.url
  try {
    domain = new URL(scan.url).hostname
  } catch {
    // use raw url
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setShareLabel('Copied!')
    setTimeout(() => setShareLabel('Share'), 2000)
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-[#0E0E0F]/90 backdrop-blur-md border-b border-white/6">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          <span className="text-sm font-semibold tracking-tight shrink-0">ShipReady</span>
          <span className="text-[#5A5955] text-sm">/</span>
          <span className="text-sm text-[#8B8A85] font-mono truncate flex-1">{domain}</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] bg-[#161618] border border-white/6 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            {shareLabel}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {/* Score + Summary */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="shrink-0">
            <ScoreRing score={results.totalScore} />
          </div>
          {results.aiSummary && (
            <div className="flex-1 pt-2">
              <p className="text-sm font-medium text-[#F1F0EE] mb-2">Summary</p>
              <p className="text-sm text-[#8B8A85] leading-relaxed line-clamp-3">
                {results.aiSummary}
              </p>
            </div>
          )}
        </section>

        {/* Category tabs */}
        <section>
          <div className="flex border-b border-white/6 mb-6 overflow-x-auto">
            {CATEGORIES.map(cat => {
              const score = results[cat].score
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap relative transition-colors ${
                    isActive
                      ? 'text-[#F1F0EE]'
                      : 'text-[#8B8A85] hover:text-[#F1F0EE]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  <span
                    className="font-mono text-xs"
                    style={{
                      color: isActive ? '#F1F0EE' : '#5A5955',
                    }}
                  >
                    {score}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF] rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Active category card */}
          <CategoryCard category={activeCategory} data={results[activeCategory]} />
        </section>

        {/* All issues */}
        {activeIssues.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">Issues to fix</h2>
            <div className="space-y-2">
              {activeIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} isPro={false} />
              ))}
            </div>
          </section>
        )}

        {/* OG Preview */}
        <section>
          <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">
            How your links appear on social media
          </h2>
          <OGPreview
            result={results}
            ogTitle=""
            ogDescription=""
            ogImage={undefined}
            siteName={domain}
          />
        </section>

        {/* Passed checks */}
        {totalPassed > 0 && (
          <section>
            <button
              onClick={() => setPassedOpen(o => !o)}
              className="flex items-center gap-2 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
            >
              <span className="text-[#3DDC84]">✓</span>
              {totalPassed} checks passed
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: passedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {passedOpen && passedIssues.length > 0 && (
              <div className="mt-3 space-y-2">
                {passedIssues.map(issue => (
                  <IssueCard key={issue.id} issue={issue} isPro={false} />
                ))}
              </div>
            )}

            {passedOpen && passedIssues.length === 0 && (
              <div className="mt-3 space-y-1">
                {CATEGORIES.map(cat =>
                  results[cat].passedChecks > 0 ? (
                    <p key={cat} className="text-xs text-[#5A5955]">
                      <span className="text-[#3DDC84]">✓</span>{' '}
                      {results[cat].passedChecks} {CATEGORY_LABELS[cat]} checks passed
                    </p>
                  ) : null
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  )
}
