import { FeatureCell } from '@/components/shared/FeatureCell'
import type { CompetitorFeature } from '@/lib/vs/competitors'

interface CompetitorTableProps {
  features: CompetitorFeature[]
  competitorName: string
}

export function CompetitorTable({ features, competitorName }: CompetitorTableProps) {
  return (
    <div className="overflow-x-auto scrollbar-hide">
      <div className="rounded-2xl border border-white/[0.06] overflow-hidden min-w-[480px]">
        {/* Header */}
        <div className="grid grid-cols-[1fr_120px_120px] bg-[#161618] border-b border-white/[0.08] px-5 py-3">
          <div />
          <div className="text-center text-[11px] text-[#a78bfa] uppercase tracking-[0.12em] font-mono">ShipReady</div>
          <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">{competitorName}</div>
        </div>

        {features.map((row, ri) => {
          const isLast = ri === features.length - 1
          return (
            <div
              key={row.label}
              className={`grid grid-cols-[1fr_120px_120px] px-5 py-3 items-center ${
                !isLast ? 'border-b border-white/[0.04]' : ''
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
    </div>
  )
}
