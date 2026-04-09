'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import type { ScanStatus } from '@/types/scan'

const FRIENDLY_ERRORS: Record<string, string> = {
  'Forbidden':             'Something went wrong on our end.',
  'Failed to create scan': 'Could not start the scan. Please try again.',
  'Invalid URL':           'Please enter a valid URL (e.g. https://yoursite.com)',
  'Rate limit exceeded. Sign in for more scans.': 'Hourly limit reached. Sign in for more scans.',
  'Free limit reached':    "You've used all 3 free scans this month.",
}

function friendlyMessage(raw: string): string {
  return FRIENDLY_ERRORS[raw] ?? raw
}

const MIN_SCAN_SCREEN_MS = 8000
const MAX_LANDING_WAIT_MS = 60_000
const POLL_INTERVAL_MS = 1500
const SCAN_STEPS = [
  { label: 'Performance & Core Web Vitals' },
  { label: 'SEO, meta tags & social cards' },
  { label: 'Security headers & SSL' },
  { label: 'Mobile & viewport checks' },
  { label: 'AI visibility & structured data' },
]

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function ScanForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [scanStatus, setScanStatus] = useState<ScanStatus | null>(null)
  const [elapsedTicks, setElapsedTicks] = useState(0)
  const [error, setError] = useState<{ msg: string; showContact: boolean } | null>(null)
  const mountedRef = useRef(true)
  const router = useRouter()
  const isScanScreenVisible = scanStatus !== null

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!isScanScreenVisible) return
    const timer = setInterval(() => setElapsedTicks(value => value + 1), 100)
    return () => clearInterval(timer)
  }, [isScanScreenVisible])

  async function openReportWhenReady(scanId: string) {
    const startedAt = Date.now()

    while (Date.now() - startedAt < MAX_LANDING_WAIT_MS) {
      try {
        const res = await fetch(`/api/scan/${scanId}`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        })

        if (res.ok) {
          const data = await res.json()
          if (mountedRef.current && data.status) {
            setScanStatus(data.status)
          }

          if (data.results || data.status === 'done' || data.status === 'error') {
            const remaining = MIN_SCAN_SCREEN_MS - (Date.now() - startedAt)
            if (remaining > 0) await sleep(remaining)
            router.push(`/report/${scanId}`)
            return
          }
        }
      } catch {
        // Keep showing the scan screen. The report page can surface stale/failure state.
      }

      await sleep(POLL_INTERVAL_MS)
    }

    router.push(`/report/${scanId}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setElapsedTicks(0)
    setScanStatus('running_fast')
    setError(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        const raw = data.error || 'Something went wrong'
        const msg = friendlyMessage(raw)
        // Show contact for unexpected server errors (5xx or unknown)
        const showContact = res.status >= 500 || raw === 'Forbidden' || raw === 'Failed to create scan'
        setError({ msg, showContact })
        setLoading(false)
        setScanStatus(null)
        return
      }
      await openReportWhenReady(data.id)
    } catch {
      setError({ msg: 'Could not reach the server. Please check your connection.', showContact: true })
      setLoading(false)
      setScanStatus(null)
    }
  }

  if (scanStatus) {
    const scanBarWidth = Math.min(3 + elapsedTicks * 0.29, 90)
    const scanCurrentStep = Math.min(Math.floor(elapsedTicks / 60), SCAN_STEPS.length - 1)
    const statusLabel =
      scanStatus === 'running_fast'
        ? 'Running fast truth checks...'
        : scanStatus === 'running_deep'
          ? 'Running deep analysis...'
          : scanStatus === 'enriching'
            ? 'Writing the report...'
            : 'Starting scan...'

    return (
      <div className="fixed inset-0 z-50 min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
        <div className="max-w-sm w-full px-6">
          <div className="mb-8">
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-sm text-[#8B8A85]">{statusLabel}</p>
              <p className="font-mono leading-none">
                <span style={{ fontSize: 22, color: '#6E56CF', fontWeight: 600 }}>
                  {Math.floor(elapsedTicks / 10)}
                </span>
                <span style={{ fontSize: 14, color: '#5A5955' }}>
                  .{elapsedTicks % 10}s
                </span>
              </p>
            </div>

            <div className="h-[3px] bg-[#1E1E21] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out"
                style={{
                  width: `${scanBarWidth}%`,
                  background: 'linear-gradient(90deg, #6E56CF, #4A9EFF)',
                }}
              />
            </div>

            <p className="mt-2 text-xs text-[#5A5955]">
              Running the scan first. If deeper checks take longer, we will open the report and keep updating it there.
            </p>
          </div>

          <div className="space-y-2">
            {SCAN_STEPS.map((step, index) => {
              const isDone = index < scanCurrentStep
              const isActive = index === scanCurrentStep
              const isPending = index > scanCurrentStep

              return (
                <div
                  key={step.label}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all duration-500"
                  style={{
                    background: isActive ? 'rgba(110,86,207,0.06)' : isDone ? '#161618' : 'transparent',
                    borderColor: isActive ? 'rgba(110,86,207,0.25)' : isDone ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
                    opacity: isPending ? 0.35 : 1,
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3DDC84]" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 shrink-0 text-[#6E56CF] animate-spin" />
                  ) : (
                    <div className="w-4 h-4 shrink-0 rounded-full border border-white/10" />
                  )}
                  <span
                    className="text-sm transition-colors duration-300"
                    style={{ color: isDone ? '#5A5955' : isActive ? '#F1F0EE' : '#5A5955' }}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>

          <p className="mt-6 text-[11px] text-[#5A5955]">
            Keep this tab open and the report will open automatically.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[560px] mx-auto">
      <div className="flex gap-2 h-[52px]">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://yoursite.com"
          disabled={loading}
          className="flex-1 h-full px-4 rounded-lg font-mono text-base sm:text-sm bg-[#161618] border border-white/10 text-[#F1F0EE] placeholder:text-[#5A5955] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 h-full rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</>
          ) : (
            'Scan →'
          )}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-sm text-[#FF4444] space-y-0.5">
          <p>{error.msg}</p>
          {error.showContact && (
            <p className="text-[#8B8A85] text-xs">
              If the problem persists, contact me:{' '}
              <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">Telegram</a>
              {' '}or{' '}
              <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">Email</a>
            </p>
          )}
        </div>
      )}
    </form>
  )
}
