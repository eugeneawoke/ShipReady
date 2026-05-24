import type { ScanResult, ScanGoal } from '@/types/scan'

interface Props {
  result: ScanResult
  primaryGoal: ScanGoal
}

const CATEGORY_LABELS: Record<string, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
  accessibility: 'Accessibility',
}

const PRIMARY_CATEGORIES: Record<ScanGoal, string[]> = {
  seo: ['seo', 'performance', 'mobile'],
  security: ['security'],
  ai_visibility: ['ai_visibility'],
  full: ['seo', 'security', 'mobile', 'performance', 'ai_visibility', 'accessibility'],
}

export function SupportingCategoryChips({ result, primaryGoal }: Props) {
  const primary = PRIMARY_CATEGORIES[primaryGoal] ?? []
  const supporting = Object.keys(CATEGORY_LABELS).filter(cat => !primary.includes(cat))

  if (supporting.length === 0) return null

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <span className="text-xs text-[#8B8A85]">Also checked:</span>
      {supporting.map(cat => {
        const catResult = result[cat as keyof ScanResult] as { score?: number | null } | undefined
        const score = catResult?.score
        return (
          <a
            key={cat}
            href={`#category-${cat}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-[#8B8A85] transition-colors hover:border-white/[0.15] hover:text-[#F1F0EE]"
          >
            {CATEGORY_LABELS[cat]}
            {score !== undefined && score !== null && (
              <span className="font-mono">{score}</span>
            )}
          </a>
        )
      })}
    </div>
  )
}
