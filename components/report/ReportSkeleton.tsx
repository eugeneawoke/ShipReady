'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

const STEPS = [
  { label: 'Performance & Core Web Vitals',  ms: 9000  },
  { label: 'SEO, meta tags & social cards',  ms: 6000  },
  { label: 'Security headers & SSL',          ms: 5000  },
  { label: 'Mobile & viewport checks',        ms: 4000  },
  { label: 'AI visibility & structured data', ms: 6000  },
]

export function ReportSkeleton({ status }: { status: string }) {
  const [activeStep, setActiveStep] = useState(0)
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set())
  const [barWidth, setBarWidth] = useState(3)

  useEffect(() => {
    if (status === 'error') return

    // Smooth progress bar: fast start, slows near 90%
    const barTimer = setInterval(() => {
      setBarWidth(prev => {
        if (prev < 55) return prev + 1.8
        if (prev < 75) return prev + 0.7
        if (prev < 87) return prev + 0.2
        return prev
      })
    }, 500)

    // Advance steps sequentially
    let step = 0
    function advance() {
      if (step >= STEPS.length - 1) return
      setTimeout(() => {
        const finished = step
        setDoneSteps(prev => new Set([...prev, finished]))
        step++
        setActiveStep(step)
        advance()
      }, STEPS[step].ms)
    }
    advance()

    return () => clearInterval(barTimer)
  }, [status])

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
        <a
          href="/"
          className="fixed top-4 left-4 text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back
        </a>
        <div className="max-w-md w-full px-6 text-center space-y-3">
          <p className="text-sm font-medium text-[#FF4444]">Scan failed</p>
          <p className="text-sm text-[#8B8A85]">Something went wrong while analyzing your site.</p>
          <p className="text-xs text-[#5A5955]">
            Try again or contact me:{' '}
            <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">Telegram</a>
            {' '}·{' '}
            <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">Email</a>
          </p>
          <a href="/" className="inline-block mt-2 text-xs px-4 py-2 rounded-lg bg-[#161618] border border-white/6 text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">
            ← Try another URL
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] flex items-center justify-center">
      <a
        href="/"
        className="fixed top-4 left-4 text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors flex items-center gap-1.5"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </a>

      <div className="max-w-sm w-full px-6">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm text-[#8B8A85] mb-3">Analyzing your site...</p>

          {/* Progress bar */}
          <div className="h-[3px] bg-[#1E1E21] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full relative overflow-hidden transition-all duration-500 ease-out"
              style={{
                width: `${barWidth}%`,
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

          <p className="mt-2 text-xs text-[#5A5955]">Usually takes 20–40 seconds</p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const isDone   = doneSteps.has(i)
            const isActive = activeStep === i && !isDone
            const isPending = !isDone && !isActive

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
      </div>
    </div>
  )
}
