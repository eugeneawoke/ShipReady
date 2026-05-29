'use client'

import { ScoreRing } from './ScoreRing'

interface CategoryScores {
  performance: number | null
  seo: number | null
  security: number | null
  mobile: number | null
  ai_visibility: number | null
  accessibility: number | null
}

const CATEGORY_LABELS: Record<keyof CategoryScores, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
  accessibility: 'Accessibility',
}

export function ScoreGrid({ scores }: { scores: CategoryScores }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
      {(Object.keys(CATEGORY_LABELS) as (keyof CategoryScores)[]).map(key => (
        <div key={key} className="flex flex-col items-center gap-2">
          <ScoreRing score={scores[key]} size={72} />
          <span className="text-[10px] font-mono text-[#5A5955] text-center leading-tight">{CATEGORY_LABELS[key]}</span>
        </div>
      ))}
    </div>
  )
}
