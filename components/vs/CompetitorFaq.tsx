import type { CompetitorFaqItem } from '@/lib/vs/competitors'

interface CompetitorFaqProps {
  items: CompetitorFaqItem[]
  competitorName: string
}

export function CompetitorFaq({ items, competitorName }: CompetitorFaqProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }

  return (
    <section>
      {/* FAQPage JSON-LD structured data — content is hardcoded, not user input */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD schema injection — static controlled data only
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-6">
        Common questions about ShipReady vs {competitorName}
      </h2>
      <div className="space-y-3">
        {items.map(({ q, a }) => (
          <div key={q} className="p-5 rounded-xl bg-[#161618] border border-white/[0.06]">
            <p className="text-sm font-medium text-[#F1F0EE] mb-1.5">{q}</p>
            <p className="text-sm text-[#8B8A85] leading-relaxed">{a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
