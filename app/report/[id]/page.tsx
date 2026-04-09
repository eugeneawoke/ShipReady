'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Share2, Check, Copy, Lock, ArrowLeft, FileDown, Loader2 } from 'lucide-react'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import { ScoreRing } from '@/components/report/ScoreRing'
import { CategoryCard } from '@/components/report/CategoryCard'
import { IssueCard } from '@/components/report/IssueCard'
import type { Scan, Issue, IssueCategory, ScanResult } from '@/types/scan'
import { createBrowserClient } from '@/lib/supabase-browser'

const FIX_TABS = [
  {
    id: 'technical' as const,
    label: 'Technical',
    subtitle: 'Cursor · Windsurf · Claude Code · Codex',
  },
  {
    id: 'vibe' as const,
    label: 'Vibe',
    subtitle: 'Bolt · Lovable · v0 · Replit · ChatGPT',
  },
]

function FixPromptSection({ technicalPrompt, vibePrompt, isPro }: {
  technicalPrompt?: string
  vibePrompt?: string
  isPro: boolean
}) {
  const [activeTab, setActiveTab] = useState<'technical' | 'vibe'>('technical')
  const [copied, setCopied] = useState(false)

  const prompt = activeTab === 'technical'
    ? (technicalPrompt ?? vibePrompt ?? '')
    : (vibePrompt ?? technicalPrompt ?? '')

  const hasPrompt = !!(technicalPrompt || vibePrompt)

  function copy() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* 2 big tabs */}
      <div className="grid grid-cols-2 border-b border-white/6">
        {FIX_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-4 text-left transition-colors cursor-pointer relative ${
              activeTab === tab.id ? 'bg-[#1A1625]' : 'hover:bg-white/[0.02]'
            }`}
          >
            <span className={`text-sm font-medium block ${
              activeTab === tab.id ? 'text-[#F1F0EE]' : 'text-[#5A5955]'
            }`}>
              {tab.label}
            </span>
            <span className="text-[11px] text-[#5A5955] mt-0.5 block">{tab.subtitle}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF]" />
            )}
          </button>
        ))}
      </div>

      {/* Prompt content */}
      <div className="p-4">
        {!hasPrompt ? (
          <div className="text-xs text-[#5A5955] bg-[#1E1E21] rounded-lg p-3 text-center">
            AI prompt not available for this scan
          </div>
        ) : isPro ? (
          <>
            <pre className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56">
              {prompt}
            </pre>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors mt-2 cursor-pointer"
            >
              {copied
                ? <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">Copied</span></>
                : <><Copy className="w-3 h-3" />Copy prompt</>
              }
            </button>
          </>
        ) : (
          <div className="relative">
            <pre
              className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56 select-none"
              style={{ filter: 'blur(5px)', userSelect: 'none' }}
            >
              {prompt}
            </pre>
            <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E0F]/60 rounded-lg backdrop-blur-[2px]">
              <div className="flex flex-col items-center gap-2">
                <Lock className="w-4 h-4 text-[#8B8A85]" />
                <a
                  href="/pricing"
                  className="text-xs text-white bg-[#6E56CF] hover:bg-[#7C68D4] px-3 py-1.5 rounded-md transition-colors"
                >
                  Upgrade to Pro →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

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

function evidenceText(issue: Issue): string {
  const evidence = issue.evidence?.slice(0, 2)
  if (!evidence?.length) return ''
  return ` Evidence: ${evidence.map(item => `${item.label}: ${item.value}`).join('; ')}.`
}

function buildMeasurementNotes(results: ScanResult): string[] {
  return CATEGORIES.flatMap(category => {
    const measurement = results[category].measurement
    if (!measurement || measurement.status === 'measured') return []
    return `${CATEGORY_LABELS[category]}: ${measurement.label} is ${measurement.status}${measurement.message ? ` (${measurement.message})` : ''}.`
  })
}

function buildDeterministicFixPrompts(results: ScanResult, activeIssues: Issue[]) {
  const issueLines = activeIssues.map((issue, index) =>
    `${index + 1}. [${issue.severity.toUpperCase()} · ${issue.confidence ?? 'unknown'}] ${issue.title}. ${issue.plainEnglish || issue.description}${evidenceText(issue)}`
  )
  const measurementNotes = buildMeasurementNotes(results)

  const issueBlock = issueLines.length
    ? issueLines.join('\n')
    : 'No verified score-bearing issues were found in the completed checks.'
  const measurementBlock = measurementNotes.length
    ? `\n\nUnavailable or partial measurements:\n${measurementNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}`
    : ''

  return {
    technical: `Fix the issues found by this ShipReady audit for ${results.url}.

Use the existing codebase and make concrete changes for these findings:
${issueBlock}${measurementBlock}

Important:
- Do not treat unavailable measurements as healthy.
- If Lighthouse/performance is unavailable, run Lighthouse or PageSpeed locally, check whether the page blocks headless Chrome, and fix any performance findings before considering the report complete.
- After changes, rerun the scan and verify that the listed findings are gone.`,
    vibe: `Improve ${results.url} based on this ShipReady audit.

Focus on:
${issueBlock}${measurementBlock}

Do not assume unavailable checks passed. If performance could not be measured, run the scan again after the visible issues are fixed and confirm the performance audit completes.`,
  }
}

function isWeakFixPrompt(prompt: string | undefined, activeIssues: Issue[], measurementNotes: string[]) {
  const text = prompt?.trim() ?? ''
  if (!text) return true
  if (text.length < 180) return true
  if (activeIssues.length > 1 && text.split(/\s+/).length < 45) return true
  return measurementNotes.length > 0 && !/unavailable|could not|lighthouse|performance|measurement/i.test(text)
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const latestScanRef = useRef<Scan | null>(null)
  const pollFailuresRef = useRef(0)
  const [id, setId] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<IssueCategory>('performance')
  const [passedOpen, setPassedOpen] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share')
  const [isPro, setIsPro] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro' | 'agency'>('free')
  // true while we haven't received the first response — shows minimal spinner, not scan skeleton
  const [initialLoading, setInitialLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [reportVisible, setReportVisible] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [pdfState, setPdfState] = useState<'idle' | 'preparing' | 'downloading'>('idle')
  const [pdfError, setPdfError] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  useEffect(() => {
    const supabase = createBrowserClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setIsLoggedIn(true)
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single()
      const userPlan = (profile?.plan ?? 'free') as 'free' | 'pro' | 'agency'
      setPlan(userPlan)
      setIsPro(userPlan === 'pro' || userPlan === 'agency')
    })
  }, [])

  useEffect(() => {
    if (!id) return
    let isPolling = false
    latestScanRef.current = null
    pollFailuresRef.current = 0

    async function poll() {
      if (isPolling) return
      isPolling = true

      try {
        const res = await fetch(`/api/scan/${id}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })

        if (!res.ok) {
          pollFailuresRef.current += 1
          if ((res.status === 404 || res.status === 403) && !latestScanRef.current && pollFailuresRef.current >= 3) {
            setLoadFailed(true)
            setInitialLoading(false)
            clearInterval(interval)
          }
          return
        }

        const data = await res.json()
        pollFailuresRef.current = 0
        latestScanRef.current = data
        setLoadFailed(false)
        setScan(data)
        setInitialLoading(false)

        if (data.results && data.status !== 'done') {
          setReportVisible(true)
        }

        if (data.status === 'done' || data.status === 'error') {
          clearInterval(interval)
          if (data.status === 'done') {
            setCompleting(true)
            setTimeout(() => {
              setCompleting(false)
              setTimeout(() => setReportVisible(true), 50)
            }, 1200)
          } else {
            setReportVisible(true)
          }
        }
      } catch {
        pollFailuresRef.current += 1
        if (!latestScanRef.current && pollFailuresRef.current >= 3) {
          setLoadFailed(true)
          setInitialLoading(false)
        }
      } finally {
        isPolling = false
      }
    }

    const interval = setInterval(poll, 2000)
    poll()
    return () => {
      clearInterval(interval)
    }
  }, [id])

  // Minimal spinner while loading existing report
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#6E56CF] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (loadFailed && !scan) {
    return <ReportSkeleton status="error" />
  }

  const shouldShowSkeleton =
    !scan ||
    scan.status === 'pending' ||
    scan.status === 'running' ||
    ((scan.status === 'running_fast' || scan.status === 'running_deep' || scan.status === 'enriching') && !scan.results)

  if (shouldShowSkeleton || completing) {
    return <ReportSkeleton status={completing ? 'completing' : (scan?.status ?? 'pending')} />
  }

  if (!scan.results) {
    return <ReportSkeleton status="error" processingIssue={scan.processingIssue} />
  }

  const { results } = scan
  const processingIssue = results.processingIssue ?? scan.processingIssue

  const allIssues: Issue[] = CATEGORIES.flatMap(cat => results[cat].issues).sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  )

  const activeIssues = allIssues.filter(i => i.severity !== 'pass')
  const passedIssues = allIssues.filter(i => i.severity === 'pass')
  const totalPassed = CATEGORIES.reduce((sum, cat) => sum + results[cat].passedChecks, 0)
  const deterministicPrompts = buildDeterministicFixPrompts(results, activeIssues)
  const measurementNotes = buildMeasurementNotes(results)
  const technicalPrompt = isWeakFixPrompt(results.aiTechnicalPrompt, activeIssues, measurementNotes)
    ? deterministicPrompts.technical
    : results.aiTechnicalPrompt
  const vibePrompt = isWeakFixPrompt(results.aiVibePrompt, activeIssues, measurementNotes)
    ? deterministicPrompts.vibe
    : results.aiVibePrompt

  let domain = scan.url
  try { domain = new URL(scan.url).hostname } catch { /* use raw url */ }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setShareLabel('Copied!')
    setTimeout(() => setShareLabel('Share'), 2000)
  }

  function filenameFromDisposition(header: string | null, fallback: string) {
    if (!header) return fallback
    const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
    if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1])
    const plainMatch = header.match(/filename="([^"]+)"/i)
    if (plainMatch?.[1]) return plainMatch[1]
    return fallback
  }

  async function handlePdfDownload() {
    if (!id || pdfState !== 'idle') return

    setPdfError(null)
    setPdfState('preparing')

    try {
      const response = await fetch(pdfHref, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        let message = 'PDF export failed'
        try {
          const body = await response.json()
          if (typeof body?.error === 'string') message = body.error
        } catch {}
        throw new Error(message)
      }

      setPdfState('downloading')

      const blob = await response.blob()
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filenameFromDisposition(
        response.headers.get('Content-Disposition'),
        `${domain.replace(/[^a-z0-9.-]+/gi, '-')}-shipready-report.pdf`,
      )
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)

      window.setTimeout(() => {
        setPdfState('idle')
      }, 1200)
    } catch (error) {
      setPdfState('idle')
      setPdfError(error instanceof Error ? error.message : 'PDF export failed')
      window.setTimeout(() => {
        setPdfError(current => (current === (error instanceof Error ? error.message : 'PDF export failed') ? null : current))
      }, 4000)
    }
  }

  const pdfHref = id
    ? `/api/report/${id}/pdf${plan === 'agency' ? '?whiteLabel=1' : ''}`
    : '#'
  const pdfBusy = pdfState !== 'idle'
  const pdfLabel =
    pdfState === 'preparing'
      ? 'Preparing PDF'
      : pdfState === 'downloading'
        ? 'Downloading'
        : (plan === 'agency' ? 'White-label PDF' : 'PDF')

  return (
    <div
      className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] transition-opacity duration-500"
      style={{ opacity: reportVisible ? 1 : 0 }}
    >
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-[#0E0E0F]/90 backdrop-blur-md border-b border-white/6">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              ShipReady
            </Link>
          )}
          <span className="text-[#5A5955] text-sm">/</span>
          <span className="text-sm text-[#8B8A85] font-mono truncate flex-1">{domain}</span>
          {isPro && (
            <button
              type="button"
              onClick={handlePdfDownload}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
              className={`group relative flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-all shrink-0 print:hidden ${
                pdfBusy
                  ? 'cursor-wait border-[#6E56CF]/35 bg-[#1A1625] text-[#F1F0EE] shadow-[0_0_0_1px_rgba(110,86,207,0.08)]'
                  : 'cursor-pointer border-white/6 bg-[#161618] text-[#8B8A85] hover:text-[#F1F0EE] hover:border-[#6E56CF]/25 hover:bg-[#19171F]'
              }`}
            >
              <span className={`absolute inset-0 rounded-lg transition-opacity ${
                pdfBusy ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} style={{ background: 'linear-gradient(90deg, rgba(110,86,207,0.14), rgba(74,158,255,0.08))' }} />
              <span className="relative flex items-center gap-2">
                {pdfBusy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileDown className="w-3.5 h-3.5" />
                )}
                <span>{pdfLabel}</span>
                <span className={`rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  pdfBusy
                    ? 'border-[#6E56CF]/40 bg-[#231C34] text-[#C7BCFF]'
                    : 'border-white/8 bg-white/[0.03] text-[#6F6E69]'
                }`}>
                  {pdfBusy ? 'Live' : 'Export'}
                </span>
              </span>
            </button>
          )}
          <button
            onClick={handleShare}
            className={`relative flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer print:hidden ${
              shareLabel === 'Copied!'
                ? 'text-[#F1F0EE] bg-[#112419] border-[#3DDC84]/35 shadow-[0_0_0_1px_rgba(61,220,132,0.08)]'
                : 'text-[#8B8A85] hover:text-[#F1F0EE] bg-[#161618] border-white/6'
            }`}
          >
            <span
              className={`absolute inset-0 rounded-lg transition-opacity ${
                shareLabel === 'Copied!' ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ background: 'linear-gradient(90deg, rgba(61,220,132,0.12), rgba(61,220,132,0.03))' }}
            />
            <span className="relative flex items-center gap-1.5">
              {shareLabel === 'Copied!' ? (
                <Check className="w-3.5 h-3.5 text-[#3DDC84]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              {shareLabel}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        {(scan.status === 'running_deep' || scan.status === 'enriching' || scan.status === 'error') && (
          <section className="rounded-xl border border-[#E8A83E]/20 bg-[#E8A83E]/5 px-4 py-3">
            <p className="text-sm text-[#F1F0EE]">
              {scan.status === 'error' ? 'Partial report saved' : 'Partial report ready'}
            </p>
            <p className="text-xs text-[#8B8A85] mt-1">
              {scan.status === 'error' && processingIssue
                ? `${processingIssue.message} ${processingIssue.recommendation}`
                : scan.status === 'error'
                  ? 'The scanner stopped before finalizing every step. Available verified results are shown below; unavailable measurements are not counted as healthy.'
                  : 'Fast truth checks are available now. Deep measurements and AI enrichment are still running, so some categories may remain unavailable for a moment.'}
            </p>
          </section>
        )}

        {/* Score + Summary */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="shrink-0">
            <ScoreRing score={results.totalScore} />
          </div>
          {(results.aiSummary || results.topPriorities?.length) && (
            <div className="flex-1 pt-2">
              <p className="text-sm font-medium text-[#F1F0EE] mb-2">Summary</p>
              {results.aiSummary && (
                <p className="text-sm text-[#8B8A85] leading-relaxed">
                  {results.aiSummary}
                </p>
              )}
              {results.topPriorities && results.topPriorities.length > 0 && (
                <div className="mt-3 space-y-1">
                  {results.topPriorities.slice(0, 3).map((priority, index) => (
                    <p key={`${priority}-${index}`} className="text-xs text-[#8B8A85]">
                      {index + 1}. {priority}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {(pdfState !== 'idle' || pdfError) && (
          <section className={`rounded-xl border px-4 py-3 transition-all ${
            pdfError
              ? 'border-[#FF4444]/20 bg-[#FF4444]/5'
              : 'border-[#6E56CF]/20 bg-[#6E56CF]/6'
          }`}>
            <p className={`text-sm ${pdfError ? 'text-[#FF8A8A]' : 'text-[#F1F0EE]'}`}>
              {pdfError
                ? 'PDF export failed'
                : pdfState === 'preparing'
                  ? 'Building your downloadable report'
                  : 'PDF is ready and download is starting'}
            </p>
            <p className="text-xs text-[#8B8A85] mt-1">
              {pdfError
                ? pdfError
                : pdfState === 'preparing'
                  ? 'We are rendering the current report into a branded PDF. This usually takes a moment.'
                  : 'You can keep reading the report. The export button will unlock automatically after the download starts.'}
            </p>
          </section>
        )}

        {/* Category tabs — screen only */}
        <section>
          <div className="print:hidden">
            <div className="flex border-b border-white/6 mb-6 overflow-x-auto">
              {CATEGORIES.map(cat => {
                const score = results[cat].score
                const isActive = activeCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap relative transition-colors cursor-pointer ${
                      isActive ? 'text-[#F1F0EE]' : 'text-[#8B8A85] hover:text-[#F1F0EE]'
                    }`}
                  >
                    {CATEGORY_LABELS[cat]}
                    <span className="font-mono text-xs" style={{ color: isActive ? '#F1F0EE' : '#5A5955' }}>
                      {score ?? '—'}
                    </span>
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF] rounded-t-full" />
                    )}
                  </button>
                )
              })}
            </div>
            <CategoryCard category={activeCategory} data={results[activeCategory]} />
          </div>

          {/* Print only — all categories stacked */}
          <div className="hidden print:block space-y-4">
            {CATEGORIES.map(cat => (
              <CategoryCard key={cat} category={cat} data={results[cat]} />
            ))}
          </div>
        </section>

        {/* Fix everything prompts — hidden in print */}
        <section className="print:hidden">
          <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">Fix everything</h2>
          <FixPromptSection
            technicalPrompt={technicalPrompt}
            vibePrompt={vibePrompt}
            isPro={isPro}
          />
        </section>

        {/* All issues */}
        {activeIssues.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">Issues to fix</h2>
            <div className="space-y-2">
              {activeIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} isPro={isPro} />
              ))}
            </div>
          </section>
        )}

        {/* Passed checks */}
        {totalPassed > 0 && (
          <section className="print:hidden">
            <button
              onClick={() => setPassedOpen(o => !o)}
              className="flex items-center gap-2 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors cursor-pointer"
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
                  <IssueCard key={issue.id} issue={issue} isPro={isPro} />
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

        {/* Print branding — Pro only, not Agency (white-label) */}
        {plan === 'pro' && (
          <div className="hidden print:flex items-center justify-between pt-6 border-t border-black/10 mt-4">
            <span className="text-xs text-black/40">
              Generated by <span className="font-semibold text-black/60">ShipReady</span> · shipready.app
            </span>
            <span className="text-xs text-black/40 font-mono">{domain}</span>
          </div>
        )}
      </main>
    </div>
  )
}
