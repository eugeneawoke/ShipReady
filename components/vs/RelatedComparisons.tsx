import Link from 'next/link'
import { competitors, competitorSlugs } from '@/lib/vs/competitors'

interface RelatedComparisonsProps {
  currentSlug: string
}

export function RelatedComparisons({ currentSlug }: RelatedComparisonsProps) {
  // Pick 4 competitors that are not the current one
  const related = competitorSlugs
    .filter(s => s !== currentSlug)
    .slice(0, 4)

  return (
    <div className="mb-12">
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-5">
        More comparisons
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {related.map(slug => {
          const c = competitors[slug]
          return (
            <Link
              key={slug}
              href={`/vs/${slug}`}
              className="group flex items-center justify-between p-4 rounded-xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-colors"
            >
              <div>
                <p className="text-sm font-medium">ShipReady vs {c.name}</p>
                <p className="text-xs text-[#5A5955] mt-0.5">{c.pricingRange}</p>
              </div>
              <span className="text-[#5A5955] group-hover:text-[#6E56CF] transition-colors text-sm shrink-0 ml-3">→</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
