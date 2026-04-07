'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Share2, Check, Copy, Lock, ArrowLeft } from 'lucide-react'
import { ReportSkeleton } from '@/components/report/ReportSkeleton'
import { ScoreRing } from '@/components/report/ScoreRing'
import { CategoryCard } from '@/components/report/CategoryCard'
import { IssueCard } from '@/components/report/IssueCard'
import type { Scan, Issue, IssueCategory } from '@/types/scan'
import { createBrowserClient } from '@/lib/supabase-browser'

const AI_TOOLS = [
  { id: 'cursor',   label: 'Cursor',   type: 'technical' as const },
  { id: 'windsurf', label: 'Windsurf', type: 'technical' as const },
  { id: 'claude',   label: 'Claude',   type: 'technical' as const },
  { id: 'bolt',     label: 'Bolt',     type: 'vibe' as const },
  { id: 'lovable',  label: 'Lovable',  type: 'vibe' as const },
  { id: 'v0',       label: 'v0',       type: 'vibe' as const },
  { id: 'replit',   label: 'Replit',   type: 'vibe' as const },
  { id: 'openai',   label: 'ChatGPT',  type: 'vibe' as const },
]

function FixPromptSection({ technicalPrompt, vibePrompt, isPro }: {
  technicalPrompt?: string
  vibePrompt?: string
  isPro: boolean
}) {
  const [activeTool, setActiveTool] = useState('cursor')
  const [copied, setCopied] = useState(false)

  const tool = AI_TOOLS.find(t => t.id === activeTool) ?? AI_TOOLS[0]
  const prompt = tool.type === 'technical'
    ? (technicalPrompt ?? vibePrompt ?? '')
    : (vibePrompt ?? technicalPrompt ?? '')

  function copy() {
    if (!prompt) return
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasPrompt = !!(technicalPrompt || vibePrompt)

  return (
    <div className="rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* Tool selector */}
      <div className="flex overflow-x-auto border-b border-white/6">
        {AI_TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTool(t.id)}
            className={`px-3 py-2.5 text-xs whitespace-nowrap transition-colors relative shrink-0 cursor-pointer ${
              activeTool === t.id ? 'text-[#F1F0EE]' : 'text-[#5A5955] hover:text-[#8B8A85]'
            }`}
          >
            {t.label}
            {activeTool === t.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Prompt content */}
      <div className="p-4">
        <p className="text-[11px] text-[#5A5955] mb-3">
          {tool.type === 'technical'
            ? 'Code-aware prompt — paste into your editor\'s AI chat'
            : 'High-level prompt — paste into the AI builder\'s chat or prompt field'}
        </p>
        <div className="relative">
          {!hasPrompt ? (
            <div className="text-xs text-[#5A5955] bg-[#1E1E21] rounded-lg p-3 text-center">
              AI prompt not available for this scan
            </div>
          ) : isPro ? (
            <>
              <pre className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-56">
                {prompt}
              </pre>
              <div className="mt-2">
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors cursor-pointer"
                >
                  {copied
                    ? <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">Copied</span></>
                    : <><Copy className="w-3 h-3" />Copy prompt</>
                  }
                </button>
              </div>
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

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const [scan, setScan] = useState<Scan | null>(null)
  const [id, setId] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<IssueCategory>('performance')
  const [passedOpen, setPassedOpen] = useState(false)
  const [shareLabel, setShareLabel] = useState('Share')
  const [isPro, setIsPro] = useState(false)
  // true while we haven't received the first response — shows minimal spinner, not scan skeleton
  const [initialLoading, setInitialLoading] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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
      const plan = profile?.plan ?? 'free'
      setIsPro(plan === 'pro' || plan === 'agency')
    })
  }, [])

  useEffect(() => {
    if (!id) return

    // eslint-disable-next-line prefer-const
    let interval: NodeJS.Timeout
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setScan(prev => prev ? { ...prev, status: 'error' } : null)
      setInitialLoading(false)
    }, 45_000)

    async function poll() {
      const res = await fetch(`/api/scan/${id}`)
      if (!res.ok) { setInitialLoading(false); return }
      const data = await res.json()
      setScan(data)
      setInitialLoading(false)
      if (data.status === 'done' || data.status === 'error') {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }

    poll()
    interval = setInterval(poll, 2000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [id])

  // Minimal spinner while loading existing report
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0F] flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-[#6E56CF] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!scan || scan.status === 'pending' || scan.status === 'running') {
    return <ReportSkeleton status={scan?.status ?? 'pending'} />
  }

  if (scan.status === 'error' || !scan.results) {
    return <ReportSkeleton status="error" />
  }

  const { results } = scan

  const allIssues: Issue[] = CATEGORIES.flatMap(cat => results[cat].issues).sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9)
  )

  const activeIssues = allIssues.filter(i => i.severity !== 'pass')
  const passedIssues = allIssues.filter(i => i.severity === 'pass')
  const totalPassed = CATEGORIES.reduce((sum, cat) => sum + results[cat].passedChecks, 0)

  let domain = scan.url
  try { domain = new URL(scan.url).hostname } catch { /* use raw url */ }

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
          {isLoggedIn ? (
            <a
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </a>
          ) : (
            <a
              href="/"
              className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              ShipReady
            </a>
          )}
          <span className="text-[#5A5955] text-sm">/</span>
          <span className="text-sm text-[#8B8A85] font-mono truncate flex-1">{domain}</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] bg-[#161618] border border-white/6 px-3 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
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
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap relative transition-colors cursor-pointer ${
                    isActive ? 'text-[#F1F0EE]' : 'text-[#8B8A85] hover:text-[#F1F0EE]'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                  <span className="font-mono text-xs" style={{ color: isActive ? '#F1F0EE' : '#5A5955' }}>
                    {score}
                  </span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#6E56CF] rounded-t-full" />
                  )}
                </button>
              )
            })}
          </div>
          <CategoryCard category={activeCategory} data={results[activeCategory]} />
        </section>

        {/* Fix everything prompts — always shown */}
        <section>
          <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">Fix everything</h2>
          <FixPromptSection
            technicalPrompt={results.aiTechnicalPrompt}
            vibePrompt={results.aiVibePrompt}
            isPro={isPro}
          />
        </section>

        {/* All issues */}
        {activeIssues.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-[#F1F0EE] mb-4">Issues to fix</h2>
            <div className="space-y-2">
              {activeIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </section>
        )}

        {/* Passed checks */}
        {totalPassed > 0 && (
          <section>
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
                  <IssueCard key={issue.id} issue={issue} />
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
