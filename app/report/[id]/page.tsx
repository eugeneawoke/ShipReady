'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, Share2, Check, Copy, Lock, FileDown, Loader2, Plus, RefreshCw, ArrowLeft } from 'lucide-react'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import { ScoreRing } from '@/components/report/ScoreRing'
import { CategoryCard } from '@/components/report/CategoryCard'
import { IssueCard } from '@/components/report/IssueCard'
import { ScanForm, useScanLauncher } from '@/components/landing/ScanForm'
import { SiteBrandLink } from '@/components/SiteHeader'
import type { Scan, Issue, IssueCategory, ScanResult, ScanStage, ScanStatus, BusinessContext, ScanGoal } from '@/types/scan'
import { createBrowserClient } from '@/lib/supabase-browser'
import {
  buildFixEverythingPrompt,
  buildPassedCheckGroups,
  formatIssueCategoryLabel,
  groupIssuesByCategory,
} from '@/lib/report/report-helpers'
import {
  normalizeStrategicRecommendationsForDisplay,
  strategicTimeframeLabel,
} from '@/lib/report/report-safety'
import { effectivePlanFromSources, type Plan } from '@/lib/growth/attribution'

function JumpingDots() {
  return (
    <span className="inline-flex items-end gap-1 text-[#C7BCFF]" aria-hidden="true">
      {[0, 1, 2].map(index => (
        <span
          key={index}
          className="jumping-dot h-1.5 w-1.5 rounded-full bg-current"
          style={{ animationDelay: `${index * 0.18}s` }}
        />
      ))}
    </span>
  )
}

function FixPromptSection({ prompt, isPro, isReady }: {
  prompt?: string
  isPro: boolean
  isReady: boolean
}) {
  const t = useTranslations('Report.prompt')
  const [copied, setCopied] = useState(false)
  const hasPrompt = !!prompt

  function copy() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      <div className="p-4">
        {!isReady ? (
          <div className="rounded-lg border border-[#6E56CF]/20 bg-[#1A1625] px-4 py-4">
            <div className="flex items-center gap-3">
              <JumpingDots />
              <p className="text-sm text-[#F1F0EE]">{t('preparing')}</p>
            </div>
            <p className="mt-2 text-xs text-[#8B8A85] leading-relaxed">
              {t('preparingBody')}
            </p>
          </div>
        ) : !hasPrompt ? (
          <div className="text-xs text-[#5A5955] bg-[#1E1E21] rounded-lg p-3 text-center">
            {t('unavailable')}
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
                ? <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">{t('copied')}</span></>
                : <><Copy className="w-3 h-3" />{t('copy')}</>
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
                <Link
                  href="/#pricing"
                  className="text-xs text-white bg-[#6E56CF] hover:bg-[#7C68D4] px-3 py-1.5 rounded-md transition-colors"
                >
                  {t('upgrade')}
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const BUSINESS_TYPE_LABELS: Record<BusinessContext['businessType'], string> = {
  ecommerce: 'E-commerce',
  saas: 'SaaS',
  local_business: 'Local business',
  portfolio: 'Portfolio',
  blog: 'Blog',
  agency: 'Agency',
  other: 'Other',
}

const SCAN_GOAL_LABELS: Record<ScanGoal, string | null> = {
  sales: 'More sales',
  leads: 'More leads',
  traffic: 'More traffic',
  visibility: 'AI visibility',
  general: null,
}

function trackGrowthEvent(eventName: string, properties?: Record<string, unknown>) {
  fetch('/api/growth/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify({ event_name: eventName, properties }),
  }).catch(() => {})
}

function BusinessProfileBlock({ businessContext, scanGoal }: {
  businessContext?: BusinessContext | null
  scanGoal?: ScanGoal
}) {
  const isHighConfidence = businessContext != null && businessContext.businessType !== 'other'

  return (
    <div
      className="rounded-xl border border-white/6 bg-white/[0.03] px-4 py-3"
      style={{ borderLeft: '3px solid #6E56CF' }}
    >
      {isHighConfidence ? (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8B8A85] font-mono">Site identified as</p>
          <p className="text-sm font-medium text-[#F1F0EE]">
            {BUSINESS_TYPE_LABELS[businessContext.businessType]}
            {businessContext.techStack.length > 0 && (
              <span className="text-[#8B8A85] font-normal">
                {' · '}{businessContext.techStack.join(' + ')}
              </span>
            )}
          </p>
          {businessContext.detectedService && (
            <p className="text-xs text-[#8B8A85]">
              <span className="text-[#6F6E69]">Selling:</span>{' '}{businessContext.detectedService}
            </p>
          )}
          {businessContext.targetAudience && (
            <p className="text-xs text-[#8B8A85]">
              <span className="text-[#6F6E69]">Audience:</span>{' '}{businessContext.targetAudience}{' '}
              <span className="text-[#5A5955]">(estimated)</span>
            </p>
          )}
          {(businessContext.icpHint && businessContext.icpHint !== 'unknown') && (
            <p className="text-xs text-[#8B8A85]">
              <span className="text-[#6F6E69]">ICP signal:</span>{' '}{businessContext.icpHint.replaceAll('_', ' ')}
            </p>
          )}
          {(businessContext.primaryConversionPath && businessContext.primaryConversionPath !== 'unknown') && (
            <p className="text-xs text-[#8B8A85]">
              <span className="text-[#6F6E69]">Conversion path:</span>{' '}{businessContext.primaryConversionPath.replaceAll('_', ' ')}
            </p>
          )}
          {scanGoal && scanGoal !== 'general' && SCAN_GOAL_LABELS[scanGoal] && (
            <p className="text-xs text-[#8B8A85]">
              <span className="text-[#6F6E69]">Your goal:</span>{' '}{SCAN_GOAL_LABELS[scanGoal]}
            </p>
          )}
          <p className="text-xs text-[#5A5955] pt-0.5">Recommendations below are tailored to this context.</p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-sm text-[#8B8A85]">Site type could not be determined confidently.</p>
          <p className="text-xs text-[#5A5955]">Recommendations are general.</p>
        </div>
      )}
    </div>
  )
}

function StrategicRecommendationsBlock({ recommendations }: {
  recommendations?: ScanResult['strategicRecommendations']
}) {
  const safeRecommendations = normalizeStrategicRecommendationsForDisplay(recommendations)

  if (!safeRecommendations.length) return null

  return (
    <section className="rounded-xl border border-[#4A9EFF]/18 bg-[#101922] px-4 py-4">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8B8A85] font-mono">Strategic recommendations</p>
        <p className="mt-1 text-xs text-[#6F6E69]">
          Non-score guidance based on the findings, business context, and scan goal.
        </p>
      </div>
      <div className="space-y-3">
        {safeRecommendations.map((item, index) => (
          <div key={`${item.timeframe}-${item.title}-${index}`} className="rounded-lg border border-white/6 bg-white/[0.03] p-3">
            <span className="inline-flex rounded-full border border-[#4A9EFF]/20 bg-[#4A9EFF]/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#A9D1FF]">
              {strategicTimeframeLabel(item.timeframe)}
            </span>
            <h3 className="mt-2 text-sm font-medium text-[#F1F0EE]">{item.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-[#8B8A85]">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
  pass: 4,
}

const CATEGORIES: IssueCategory[] = ['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility']
const ACTIVE_SCAN_STATUSES: ScanStatus[] = ['pending', 'running', 'running_fast', 'running_deep', 'enriching', 'crawling']
type StageState = 'done' | 'running' | 'pending' | 'unavailable' | 'partial' | 'failed'
type ProgressStage = { id: string; title: string; state: StageState; detail: string }
type BetaGrantRow = {
  granted_plan: Exclude<Plan, 'free'> | null
  starts_at: string | null
  expires_at: string | null
  revoked_at: string | null
}

function stageTone(state: StageState) {
  if (state === 'done') return 'border-[#3DDC84]/25 bg-[#3DDC84]/8 text-[#3DDC84]'
  if (state === 'running') return 'border-[#6E56CF]/35 bg-[#6E56CF]/10 text-[#C7BCFF]'
  if (state === 'partial') return 'border-[#E8A83E]/25 bg-[#E8A83E]/8 text-[#E8A83E]'
  if (state === 'failed') return 'border-[#FF6B6B]/25 bg-[#FF6B6B]/8 text-[#FF8A8A]'
  if (state === 'unavailable') return 'border-[#E8A83E]/25 bg-[#E8A83E]/8 text-[#E8A83E]'
  return 'border-white/8 bg-white/[0.03] text-[#6F6E69]'
}

function stageLabel(state: StageState, t: ReturnType<typeof useTranslations<'Report.progress'>>) {
  if (state === 'done') return t('state.done')
  if (state === 'running') return t('state.running')
  if (state === 'partial') return t('state.partial')
  if (state === 'failed') return t('state.failed')
  if (state === 'unavailable') return t('state.unavailable')
  return t('state.pending')
}

function hasUnavailableMeasurements(results: ScanResult) {
  return CATEGORIES.some(category => results[category].measurement?.status === 'unavailable')
}

function hasIncompleteStages(results: ScanResult) {
  return results.stages?.some(stage => stage.status === 'partial' || stage.status === 'failed') ?? false
}

function stageTitle(stage: ScanStage, t: ReturnType<typeof useTranslations<'Report.progress'>>) {
  if (stage.id === 'fast') return t('stages.fastTitle')
  if (stage.id === 'crawl') return t('stages.crawlTitle')
  if (stage.id === 'lighthouse') return t('stages.lighthouseTitle')
  return t('stages.aiTitle')
}

function stageDetail(stage: ScanStage, t: ReturnType<typeof useTranslations<'Report.progress'>>) {
  if (stage.message) return stage.message
  if (stage.id === 'fast') return t('stages.fastDetail')
  if (stage.id === 'crawl') return stage.status === 'done' ? t('stages.crawlDone') : t('stages.crawlPending')
  if (stage.id === 'lighthouse') return stage.status === 'done' ? t('stages.lighthouseDone') : t('stages.lighthousePending')
  return stage.status === 'done' ? t('stages.aiDone') : t('stages.aiPending')
}

function mapTelemetryStageState(stage: ScanStage): StageState {
  if (stage.status === 'queued') return 'pending'
  return stage.status
}

function buildScanStages(scan: Scan, results: ScanResult, t: ReturnType<typeof useTranslations<'Report.progress'>>): ProgressStage[] {
  if (results.stages?.length) {
    return results.stages.map(stage => ({
      id: stage.id,
      title: stageTitle(stage, t),
      state: mapTelemetryStageState(stage),
      detail: stageDetail(stage, t),
    }))
  }

  const performanceMeasurement = results.performance.measurement
  const isActive = ACTIVE_SCAN_STATUSES.includes(scan.status)
  const deepDone = results.phase === 'deep' || results.phase === 'enriching' || results.phase === 'final'
  const aiDone = Boolean(results.aiSummary || results.aiTechnicalPrompt || (results.issuePrompts && Object.keys(results.issuePrompts).length > 0))
  const performanceStillRunning = performanceMeasurement?.status === 'unavailable'
    && /still running/i.test(performanceMeasurement.message ?? '')

  return [
    {
      id: 'fast',
      title: t('stages.fastTitle'),
      state: results ? 'done' : 'running',
      detail: t('stages.fastDetail'),
    },
    {
      id: 'lighthouse',
      title: t('stages.lighthouseTitle'),
      state: performanceMeasurement?.status === 'unavailable'
        ? (performanceStillRunning ? 'running' : 'unavailable')
        : deepDone
          ? 'done'
          : scan.status === 'running_deep'
            ? 'running'
            : 'pending',
      detail: performanceMeasurement?.message
        ?? (deepDone ? t('stages.lighthouseDone') : t('stages.lighthousePending')),
    },
    {
      id: 'enrichment',
      title: t('stages.aiTitle'),
      state: aiDone
        ? 'done'
        : scan.status === 'enriching'
          ? 'running'
          : isActive
            ? 'pending'
            : 'unavailable',
      detail: aiDone
        ? t('stages.aiDone')
        : isActive
          ? t('stages.aiPending')
          : t('stages.aiUnavailable'),
    },
  ]
}

function ScanProgressPanel({ scan, results, processingIssue, retryingMeasurement, retryError, onRetryLighthouse }: {
  scan: Scan
  results: ScanResult
  processingIssue?: Scan['processingIssue']
  retryingMeasurement: boolean
  retryError: string | null
  onRetryLighthouse: () => void
}) {
  const t = useTranslations('Report.progress')
  const isActive = ACTIVE_SCAN_STATUSES.includes(scan.status)
  const unavailable = hasUnavailableMeasurements(results)
  const incompleteStages = hasIncompleteStages(results)
  const stages = buildScanStages(scan, results, t)

  if (!isActive && scan.status !== 'error' && !unavailable && !incompleteStages) return null

  return (
    <section className={`rounded-xl border px-4 py-4 ${
      scan.status === 'error' || unavailable || incompleteStages
        ? 'border-[#E8A83E]/20 bg-[#E8A83E]/5'
        : 'border-[#6E56CF]/25 bg-[#6E56CF]/7'
    }`}>
      <div className="flex items-start gap-3">
        {isActive ? (
          <Loader2 className="w-4 h-4 text-[#C7BCFF] animate-spin mt-0.5 shrink-0" />
        ) : (
          <span className="text-[#E8A83E] text-sm mt-0.5 shrink-0">!</span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#F1F0EE]">
            {isActive ? t('scanRunning') : (unavailable ? t('unavailableMeasurements') : t('partialReport'))}
          </p>
          <p className="text-xs text-[#8B8A85] mt-1 leading-relaxed">
            {scan.status === 'error' && processingIssue
              ? `${processingIssue.message} ${processingIssue.recommendation}`
              : isActive
                ? t('activeBody')
                : t('inactiveBody')}
          </p>
        </div>
      </div>

      <div className="grid gap-2 mt-4">
        {stages.map(stage => {
          const canRetryLighthouse = !isActive
            && stage.id === 'lighthouse'
            && results.performance.measurement?.status === 'unavailable'
          return (
          <div key={stage.id} className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-[#111113] px-3 py-2.5">
            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.08em] ${stageTone(stage.state)}`}>
              {stageLabel(stage.state, t)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-[#F1F0EE]">{stage.title}</p>
              <p className="text-xs text-[#6F6E69] mt-0.5 leading-relaxed">{stage.detail}</p>
              {canRetryLighthouse && retryError ? (
                <p className="mt-1 text-[11px] text-[#FF8A8A]">{retryError}</p>
              ) : null}
            </div>
            {canRetryLighthouse ? (
              <button
                type="button"
                onClick={onRetryLighthouse}
                disabled={retryingMeasurement}
                className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[11px] transition-colors ${
                  retryingMeasurement
                    ? 'cursor-wait border-white/6 bg-white/[0.03] text-[#5A5955]'
                    : 'cursor-pointer border-[#E8A83E]/25 bg-[#E8A83E]/8 text-[#E8A83E] hover:border-[#E8A83E]/40 hover:bg-[#E8A83E]/12'
                }`}
              >
                {retryingMeasurement ? t('retrying') : t('retryLighthouse')}
              </button>
            ) : null}
          </div>
          )
        })}
      </div>
    </section>
  )
}

function isWeakFixPrompt(prompt: string | undefined, activeIssues: Issue[]) {
  const text = prompt?.trim() ?? ''
  if (!text) return true
  if (text.length < 260) return true
  if (activeIssues.length > 1 && text.split(/\s+/).length < 80) return true
  return !/verify|verification|checklist|issue|fix/i.test(text)
}

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('Report')
  const [scan, setScan] = useState<Scan | null>(null)
  const latestScanRef = useRef<Scan | null>(null)
  const pollFailuresRef = useRef(0)
  const [id, setId] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<IssueCategory>('performance')
  const [passedOpen, setPassedOpen] = useState(false)
  const [shareLabel, setShareLabel] = useState('')
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
  const [newScanOpen, setNewScanOpen] = useState(false)
  const [pollVersion, setPollVersion] = useState(0)
  const [retryingMeasurement, setRetryingMeasurement] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [passedCategoryOpen, setPassedCategoryOpen] = useState<Record<string, boolean>>({})
  const {
    loading: rescanLoading,
    error: rescanError,
    launchScan: launchRescan,
  } = useScanLauncher()

  useEffect(() => {
    setShareLabel(t('share'))
  }, [t])

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
      const { data: grants } = await supabase
        .from('beta_access_grants')
        .select('granted_plan, starts_at, expires_at, revoked_at')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('created_at', { ascending: false })
      const profilePlan = (profile?.plan ?? 'free') as Plan
      const userPlan = effectivePlanFromSources({
        profilePlan,
        grants: grants as BetaGrantRow[] | null,
      }).plan
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
  }, [id, pollVersion])

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
  const totalPassed = CATEGORIES.reduce((sum, cat) => sum + results[cat].passedChecks, 0)
  const deterministicPrompt = buildFixEverythingPrompt(results, activeIssues)
  const groupedIssues = groupIssuesByCategory(activeIssues)
  const passedCheckGroups = buildPassedCheckGroups(results)
  const isScanActive = ACTIVE_SCAN_STATUSES.includes(scan.status)
  const isFinalReport = scan.status === 'done'
  const hasUnavailable = hasUnavailableMeasurements(results)
  const pagespeedData = results.providerData?.pagespeed
  const recurringIssues = results.siteSummary?.recurringIssues ?? []
  const fixEverythingPrompt = isWeakFixPrompt(results.aiTechnicalPrompt, activeIssues)
    ? deterministicPrompt
    : `${results.aiTechnicalPrompt}\n\nFull issue context to cover in the same pass:\n${deterministicPrompt}`

  let domain = scan.url
  try { domain = new URL(scan.url).hostname } catch { /* use raw url */ }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setShareLabel(t('copied'))
    setTimeout(() => setShareLabel(t('share')), 2000)
  }

  async function handleRescan() {
    if (rescanLoading || isScanActive) return
    await launchRescan(results.url)
  }

  async function handleRetryLighthouse() {
    if (!id || retryingMeasurement || isScanActive) return

    setRetryingMeasurement(true)
    setRetryError(null)

    try {
      const response = await fetch(`/api/scan/${id}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ measurement: 'lighthouse' }),
      })

      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || t('progress.retryLighthouse'))
      }

      if (body.scan) {
        setScan(body.scan)
        latestScanRef.current = body.scan
      }
      setReportVisible(true)
      setPollVersion(version => version + 1)
    } catch (error) {
      setRetryError(error instanceof Error ? error.message : t('progress.retryLighthouse'))
    } finally {
      setRetryingMeasurement(false)
    }
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

    trackGrowthEvent('pdf_export_clicked', { reportId: id })
    setPdfError(null)
    setPdfState('preparing')

    try {
      const response = await fetch(pdfHref, {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        let message = t('pdf.failedFallback')
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
      setPdfError(error instanceof Error ? error.message : t('pdf.failedFallback'))
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
      ? t('pdf.preparing')
      : pdfState === 'downloading'
        ? t('pdf.downloading')
        : (plan === 'agency' ? t('pdf.whiteLabel') : t('pdf.label'))

  return (
    <div
      className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] transition-opacity duration-500"
      style={{ opacity: reportVisible ? 1 : 0 }}
    >
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-[#0E0E0F]/90 backdrop-blur-md border-b border-white/6">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-2 min-w-0">
          <SiteBrandLink className="shrink-0" />
          <span className="text-[#5A5955] text-sm">/</span>
          <span className="text-sm text-[#8B8A85] font-mono truncate flex-1">{domain}</span>
          <button
            type="button"
            onClick={() => setNewScanOpen(open => !open)}
            aria-expanded={newScanOpen}
            aria-label="Start a new scan"
            className={`relative flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer print:hidden ${
              newScanOpen
                ? 'text-[#F1F0EE] bg-[#1A1625] border-[#6E56CF]/35'
                : 'text-[#8B8A85] hover:text-[#F1F0EE] bg-[#161618] border-white/6'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('newScan')}</span>
          </button>
          <button
            type="button"
            onClick={handleRescan}
            disabled={rescanLoading || isScanActive}
            aria-busy={rescanLoading}
            aria-label="Rescan this URL"
            className={`relative flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all shrink-0 print:hidden ${
              rescanLoading || isScanActive
                ? 'cursor-not-allowed border-white/6 bg-[#161618] text-[#5A5955]'
                : 'cursor-pointer border-white/6 bg-[#161618] text-[#8B8A85] hover:text-[#F1F0EE]'
            }`}
          >
            {rescanLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{rescanLoading ? t('rescanning') : t('rescan')}</span>
          </button>
          {isPro && (
            <button
              type="button"
              onClick={handlePdfDownload}
              disabled={pdfBusy}
              aria-busy={pdfBusy}
              aria-label="Download PDF report"
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
                <span className="hidden sm:inline">{pdfLabel}</span>
                <span className={`hidden sm:inline rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  pdfBusy
                    ? 'border-[#6E56CF]/40 bg-[#231C34] text-[#C7BCFF]'
                    : 'border-white/8 bg-white/[0.03] text-[#6F6E69]'
                }`}>
                  {pdfBusy ? t('pdf.live') : t('pdf.export')}
                </span>
              </span>
            </button>
          )}
          <button
            onClick={handleShare}
            aria-label="Copy share link"
            className={`relative flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer print:hidden ${
              shareLabel === t('copied')
                ? 'text-[#F1F0EE] bg-[#112419] border-[#3DDC84]/35 shadow-[0_0_0_1px_rgba(61,220,132,0.08)]'
                : 'text-[#8B8A85] hover:text-[#F1F0EE] bg-[#161618] border-white/6'
            }`}
          >
            <span
              className={`absolute inset-0 rounded-lg transition-opacity ${
                shareLabel === t('copied') ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ background: 'linear-gradient(90deg, rgba(61,220,132,0.12), rgba(61,220,132,0.03))' }}
            />
            <span className="relative flex items-center gap-1.5">
              {shareLabel === t('copied') ? (
                <Check className="w-3.5 h-3.5 text-[#3DDC84]" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{shareLabel}</span>
            </span>
          </button>
        </div>
        {newScanOpen && (
          <div className="border-t border-white/6 bg-[#0E0E0F]/95 px-4 py-3 print:hidden">
            <div className="max-w-4xl mx-auto">
              <ScanForm compact autoFocus submitLabel={t('rescan')} />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        <div>
          <Link
            href={isLoggedIn ? '/dashboard' : '/'}
            className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE]"
          >
            <ArrowLeft className="h-4 w-4" />
            {isLoggedIn ? t('dashboard') : 'ShipReady'}
          </Link>
        </div>
        {rescanError && (
          <section className="rounded-xl border border-[#FF4444]/20 bg-[#FF4444]/5 px-4 py-3">
            <p className="text-sm text-[#FF8A8A]">{t('rescanFailed')}</p>
            <p className="text-xs text-[#8B8A85] mt-1">{rescanError.msg}</p>
          </section>
        )}
        <ScanProgressPanel
          scan={scan}
          results={results}
          processingIssue={processingIssue}
          retryingMeasurement={retryingMeasurement}
          retryError={retryError}
          onRetryLighthouse={handleRetryLighthouse}
        />
        {pagespeedData && (
          <section className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3">
            <p className="text-sm text-[#F1F0EE]">{t('pagespeedTitle')}</p>
            <p className="mt-1 text-xs text-[#8B8A85] leading-relaxed">
              {t('pagespeedBody', {
                strategy: pagespeedData.strategy,
                fetchedAt: new Date(pagespeedData.fetchedAt).toLocaleString(),
                source: `${pagespeedData.source} · ${pagespeedData.analysisUrl}`,
              })}
            </p>
          </section>
        )}
        {recurringIssues.length > 0 && (
          <section className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4">
            <p className="text-sm text-[#F1F0EE]">{t('siteSummaryTitle')}</p>
            <p className="mt-1 text-xs text-[#8B8A85] leading-relaxed">
              {t('siteSummaryBody', { count: results.siteSummary?.pagesCrawled ?? 0 })}
            </p>
            <div className="mt-3 space-y-2">
              {recurringIssues.slice(0, 3).map((issue) => (
                <div key={`${issue.issueId}-${issue.category}`} className="rounded-lg border border-white/[0.05] bg-[#111113] px-3 py-2.5">
                  <p className="text-xs text-[#F1F0EE]">
                    {issue.title} · {issue.occurrenceCount} pages
                  </p>
                  <p className="mt-1 text-[11px] text-[#6F6E69] leading-relaxed">
                    {issue.urls.slice(0, 3).join(' • ')}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Business profile — only when scan is done */}
        {isFinalReport && (
          <BusinessProfileBlock
            businessContext={results.businessContext}
            scanGoal={results.scanGoal}
          />
        )}

        {/* Score + Summary */}
        <section className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
          <div className="shrink-0">
            <ScoreRing score={results.totalScore} />
            {(isScanActive || hasUnavailable) && (
              <p className="text-center text-xs text-[#8B8A85] mt-3">
                {isScanActive ? t('draftScore') : t('unavailableExcluded')}
              </p>
            )}
          </div>
          {isFinalReport && (results.aiSummary || results.topPriorities?.length) && (
            <div className="flex-1 pt-2">
              <p className="text-sm font-medium text-[#F1F0EE] mb-2">{t('summary')}</p>
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

        {isFinalReport && (
          <StrategicRecommendationsBlock recommendations={results.strategicRecommendations} />
        )}

        {(pdfState !== 'idle' || pdfError) && (
          <section className={`rounded-xl border px-4 py-3 transition-all ${
            pdfError
              ? 'border-[#FF4444]/20 bg-[#FF4444]/5'
              : 'border-[#6E56CF]/20 bg-[#6E56CF]/6'
          }`}>
            <p className={`text-sm ${pdfError ? 'text-[#FF8A8A]' : 'text-[#F1F0EE]'}`}>
              {pdfError
                ? t('pdf.failedTitle')
                : pdfState === 'preparing'
                  ? t('pdf.buildingTitle')
                  : t('pdf.readyTitle')}
            </p>
            <p className="text-xs text-[#8B8A85] mt-1">
              {pdfError
                ? pdfError
                : pdfState === 'preparing'
                  ? t('pdf.buildingBody')
                  : t('pdf.readyBody')}
            </p>
          </section>
        )}

        {/* Category tabs — screen only */}
        <section>
          <div className="print:hidden">
            <div className="flex border-b border-white/6 mb-6 overflow-x-auto scrollbar-hide">
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
                    {t(`categories.${cat}`)}
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

        {/* Fix prompts — hidden in print */}
        <section className="print:hidden">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-[#F1F0EE]">{t('fixPromptsTitle')}</h2>
          </div>
          <FixPromptSection
            prompt={fixEverythingPrompt}
            isPro={isPro}
            isReady={isFinalReport}
          />
        </section>

        {/* All issues */}
        {activeIssues.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">{t('issuesToFix')}</h2>
            <div className="space-y-5">
              {groupedIssues.map(group => (
                <div key={group.category}>
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6F6E69]">
                      {formatIssueCategoryLabel(group.category)}
                    </span>
                    <span className="text-[10px] text-[#5A5955]">
                      {group.issues.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {group.issues.map(issue => (
                      <IssueCard key={issue.id} issue={issue} isPro={isPro} promptsReady={isFinalReport} />
                    ))}
                  </div>
                </div>
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
              {t('checksPassed', { count: totalPassed })}
              <ChevronDown
                className="w-4 h-4 transition-transform duration-200"
                style={{ transform: passedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {passedOpen && (
              <div className="mt-3 space-y-2">
                {passedCheckGroups.map(group => {
                  const isGroupOpen = Boolean(passedCategoryOpen[group.category])
                  return (
                    <div key={group.category} className="rounded-xl border border-white/6 bg-[#161618] overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setPassedCategoryOpen(current => ({ ...current, [group.category]: !current[group.category] }))}
                        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
                      >
                        <span className="text-[#3DDC84] text-[11px]">✓</span>
                        <span className="flex-1 text-sm text-[#8B8A85]">
                          {t('categoryChecksPassed', { count: group.checks.length, category: t(`categories.${group.category}`) })}
                        </span>
                        <ChevronDown
                          className="w-4 h-4 text-[#5A5955] transition-transform duration-200"
                          style={{ transform: isGroupOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        />
                      </button>
                      {isGroupOpen && (
                        <div className="border-t border-white/[0.04] px-4 py-3 space-y-2">
                          {group.checks.map(check => (
                            <div key={check.id} className="flex items-start gap-2">
                              <span className="text-[#3DDC84] text-[10px] mt-0.5 shrink-0">✓</span>
                              <div>
                                <p className="text-xs text-[#8B8A85]">{check.name}</p>
                                <p className="text-[11px] text-[#5A5955] mt-0.5 leading-relaxed">{check.detail}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Print branding — Pro only, not Agency (white-label) */}
        {plan === 'pro' && (
          <div className="hidden print:flex items-center justify-between pt-6 border-t border-black/10 mt-4">
            <span className="text-xs text-black/40">
              {t('generatedBy')} <span className="font-semibold text-black/60">ShipReady</span> · shipready.app
            </span>
            <span className="text-xs text-black/40 font-mono">{domain}</span>
          </div>
        )}
      </main>
    </div>
  )
}
