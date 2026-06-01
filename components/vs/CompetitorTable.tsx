import { FeatureCell } from '@/components/shared/FeatureCell'
import type { CompetitorFeature, FeatureCategory } from '@/lib/vs/competitors'

interface CompetitorTableProps {
  features: CompetitorFeature[]
  competitorName: string
}

const CATEGORY_ORDER: FeatureCategory[] = ['AI Visibility', 'Security', 'SEO', 'Performance', 'Pricing', 'Usability']

const CATEGORY_COLORS: Record<FeatureCategory, string> = {
  'AI Visibility': '#A78BFA',
  'Security': '#FF4444',
  'SEO': '#4A9EFF',
  'Performance': '#F5C518',
  'Pricing': '#3DDC84',
  'Usability': '#8B8A85',
}

export function CompetitorTable({ features, competitorName }: CompetitorTableProps) {
  // Group features by category, preserve CATEGORY_ORDER
  const grouped: Partial<Record<FeatureCategory, CompetitorFeature[]>> = {}
  for (const row of features) {
    if (!grouped[row.category]) grouped[row.category] = []
    grouped[row.category]!.push(row)
  }

  const orderedCategories = CATEGORY_ORDER.filter(c => grouped[c]?.length)

  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden min-w-[480px]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_120px] bg-[#161618] border-b border-white/[0.08] px-5 py-3">
          <div />
          <div className="text-center text-[11px] text-[#a78bfa] uppercase tracking-[0.12em] font-mono">ShipReady</div>
          <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">{competitorName}</div>
        </div>

        {orderedCategories.map(category => (
          <div key={category}>
            {/* Category separator */}
            <div
              className="grid grid-cols-[1fr_120px_120px] px-5 py-2 bg-[#0E0E0F] border-b border-white/[0.04]"
              style={{ borderLeft: `2px solid ${CATEGORY_COLORS[category]}` }}
            >
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: CATEGORY_COLORS[category] }}>
                {category}
              </span>
            </div>

            {/* Rows for this category */}
            {grouped[category]!.map((row, ri) => {
              const isLast = ri === grouped[category]!.length - 1
              return (
                <div
                  key={row.label}
                  className={`grid grid-cols-[1fr_120px_120px] px-5 py-3 items-center ${
                    !isLast ? 'border-b border-white/[0.04]' : 'border-b border-white/[0.06]'
                  } ${ri % 2 === 0 ? 'bg-[#0E0E0F]' : 'bg-[#111113]'}`}
                >
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="text-sm text-[#C9C8C3] leading-snug">{row.label}</span>
                    {row.note && (
                      <span className="text-[11px] text-[#3A3A3A] shrink-0 hidden md:inline">{row.note}</span>
                    )}
                  </div>
                  <FeatureCell value={row.shipready} highlight />
                  <FeatureCell value={row.competitor} />
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
