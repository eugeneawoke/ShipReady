'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { ScanForm } from '@/components/landing/ScanForm'
import { SiteBrandLink } from '@/components/SiteHeader'
import type { ScanProcessingIssue } from '@/types/scan'

const STEPS = [
  { label: 'Performance & Core Web Vitals'  },
  { label: 'SEO, meta tags & social cards'  },
  { label: 'Security headers & SSL'          },
  { label: 'Mobile & viewport checks'        },
  { label: 'AI visibility & structured data' },
]

export function ReportSkeleton({ status, processingIssue }: { status: string; processingIssue?: ScanProcessingIssue }) {
  const [elapsed, setElapsed] = useState(0) // counts 100ms ticks
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const didPushStateRef = useRef(false)
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const router = useRouter()
  const statusLabel =
    status === 'running_fast'
      ? 'Running fast truth checks...'
      : status === 'running_deep'
        ? 'Running deep analysis...'
        : status === 'enriching'
          ? 'Writing the final report...'
          : 'Analyzing your site...'

  // Start timer once on mount
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(p => p + 1), 100)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Stop timer when scan reaches a terminal state
  useEffect(() => {
    if (status === 'error' || status === 'completing') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [status])

  useEffect(() => {
    // Only guard during active scanning states
    if (status === 'error' || status === 'completing') return

    // Push a dummy history entry so the browser back button fires popstate
    // instead of navigating away immediately — only once across all re-runs
    if (!didPushStateRef.current) {
      window.history.pushState(null, '', window.location.href)
      didPushStateRef.current = true
    }

    function handlePopState() {
      // Re-push so repeated back presses keep showing the modal
      window.history.pushState(null, '', window.location.href)
      setIsLeaveModalOpen(true)
    }

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
      e.returnValue = '' // triggers browser's native "Leave site?" dialog
    }

    window.addEventListener('popstate', handlePopState)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [status])

  // Progress bar width and active step are derived from elapsed time (real-time, not fake delays)
  // elapsed is in 100ms ticks: 300 ticks = 30s
  // bar grows from 3% to 90% over 30s, steps advance every 60 ticks (6s each)
  const scanBarWidth = Math.min(3 + elapsed * 0.29, 90)
  const scanCurrentStep = Math.min(Math.floor(elapsed / 60), STEPS.length - 1)

  if (status === 'completing') {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center transition-opacity duration-500">
        <div className="max-w-sm w-full px-6">
          <div className="mb-8">
            <p className="text-sm text-[#3DDC84] mb-3">✓ Scan complete!</p>
            <div className="h-[3px] bg-[#1E1E21] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: '100%',
                  background: 'linear-gradient(90deg, #6E56CF, #4A9EFF)',
                  transition: 'width 0.4s ease-out',
                }}
              />
            </div>
            <p className="mt-2 text-xs text-[#5A5955]">Loading your report…</p>
          </div>
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                style={{
                  background: '#161618',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#3DDC84]" />
                <span className="text-sm text-[#5A5955]">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
        <div className="fixed inset-x-0 top-0 border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
            <SiteBrandLink />
          </div>
        </div>
        <div className="max-w-md w-full px-6 text-center space-y-3">
          <p className="text-sm font-medium text-[#FF4444]">Scan failed</p>
          {elapsed > 0 && (
            <p className="text-xs font-mono" style={{ color: '#FF4444' }}>
              Failed after {Math.floor(elapsed / 10)}.{elapsed % 10}s
            </p>
          )}
          <p className="text-sm text-[#8B8A85]">Something went wrong while analyzing your site.</p>
          {processingIssue && (
            <div className="rounded-lg border border-[#FF4444]/20 bg-[#FF4444]/5 px-4 py-3 text-left">
              <p className="text-xs text-[#FF8A8A]">{processingIssue.message}</p>
              <p className="mt-1 text-xs text-[#8B8A85]">{processingIssue.recommendation}</p>
            </div>
          )}
          {/* max-w-md intentionally narrower than ScanForm's own max-w — keeps it contained in the error card */}
          <div className="w-full max-w-md mx-auto">
            <ScanForm />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
      <div className="fixed inset-x-0 top-0 border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-6">
          <SiteBrandLink />
          <button
            onClick={() => setIsLeaveModalOpen(true)}
            className="text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5 cursor-pointer bg-transparent border-0 p-0"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Leave
          </button>
        </div>
      </div>

      <div className="max-w-sm w-full px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-3">
            <p className="text-sm text-[#8B8A85]">{statusLabel}</p>
            <p className="font-mono leading-none">
              <span style={{ fontSize: 22, color: '#6E56CF', fontWeight: 600 }}>
                {Math.floor(elapsed / 10)}
              </span>
              <span style={{ fontSize: 14, color: '#5A5955' }}>
                .{elapsed % 10}s
              </span>
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-[3px] bg-[#1E1E21] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out"
              style={{
                width: `${scanBarWidth}%`,
                background: 'linear-gradient(90deg, #6E56CF, #4A9EFF)',
              }}
            >
              {/* Shimmer sweep */}
              <div
                className="bar-shimmer absolute inset-0 w-1/2"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-[#5A5955]">
            {elapsed > 400
              ? <span style={{ color: '#E8A83E' }}>Taking longer than usual. Fast checks finish first; deep checks can take longer on complex sites.</span>
              : 'Running fast checks first, then deep analysis. Complex sites may take longer.'
            }
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const isDone    = i < scanCurrentStep
            const isActive  = i === scanCurrentStep
            const isPending = i > scanCurrentStep

            return (
              <div
                key={i}
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

        <p className="mt-6 text-[11px] text-[#5A5955] flex items-start gap-1.5">
          <span style={{ color: '#E8A83E', fontSize: 13, lineHeight: 1.4 }}>⚠</span>
          You can leave this screen, but keep it open if you want the report to open automatically.
        </p>
      </div>

      {isLeaveModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(14,14,15,0.85)', backdropFilter: 'blur(4px)' }}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsLeaveModalOpen(false) }}
        >
          <div
            className="w-full max-w-[300px] mx-4 rounded-xl p-6 text-center"
            style={{ background: '#161618', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <p className="text-sm font-medium text-[#F1F0EE] mb-2">Leave scan screen?</p>
            <p className="text-xs text-[#8B8A85] leading-relaxed mb-6">
              The scan can continue in the background, but this screen will stop tracking progress.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="flex-1 py-2 rounded-lg text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors cursor-pointer"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Keep scanning
              </button>
              <button
                onClick={() => router.push('/')}
                className="flex-1 py-2 rounded-lg text-xs cursor-pointer transition-colors"
                style={{
                  background: '#2A1A1A',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#FF6B6B',
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
