'use client'

import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score: number | null
  size?: number
}

function getScoreColor(score: number | null): string {
  if (score === null) return '#8B8A85'
  if (score >= 90) return '#3DDC84'
  if (score >= 70) return '#7BC67E'
  if (score >= 50) return '#F5C518'
  return '#FF4444'
}

export function ScoreRing({ score, size = 180 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const color = getScoreColor(score)

  useEffect(() => {
    const circle = circleRef.current
    if (!circle || score === null) return
    const offset = circumference - (score / 100) * circumference
    circle.style.strokeDasharray = `${circumference}`
    circle.style.strokeDashoffset = `${circumference}`

    requestAnimationFrame(() => {
      circle.style.transition = 'stroke-dashoffset 1200ms cubic-bezier(0.34, 1.56, 0.64, 1)'
      circle.style.strokeDashoffset = `${offset}`
    })
  }, [score, circumference])

  return (
    <div
      className="score-ring relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span
          className="font-mono text-[64px] font-medium leading-none"
          style={{ color }}
        >
          {score ?? '—'}
        </span>
        <span className="text-[11px] text-[#5A5955] uppercase tracking-[0.08em] mt-1">
          {score === null ? 'PENDING' : 'SCORE'}
        </span>
      </div>
    </div>
  )
}
