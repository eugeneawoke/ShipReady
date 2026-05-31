'use client'

interface ChangelogPhase {
  id: string
  title: string
  subtitle: string
  status: string
  releaseDate?: string
  items: string[]
}

interface ChangelogViewProps {
  phases: ChangelogPhase[]
  releasedLabel: string
  emptyLabel: string
  locale: string
}

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatMonthYear(iso: string, locale: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-US', {
    year: 'numeric',
    month: 'long',
  })
}

export function ChangelogView({ phases, releasedLabel, emptyLabel, locale }: ChangelogViewProps) {
  const released = phases
    .filter(p => p.status === 'done' && p.releaseDate)
    .sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime())

  if (released.length === 0) {
    return (
      <p className="text-sm text-[#5A5955] text-center py-12">{emptyLabel}</p>
    )
  }

  // Group by month-year
  const groups: Record<string, ChangelogPhase[]> = {}
  for (const phase of released) {
    const key = formatMonthYear(phase.releaseDate!, locale)
    if (!groups[key]) groups[key] = []
    groups[key].push(phase)
  }

  return (
    <div className="space-y-10">
      {Object.entries(groups).map(([month, groupPhases]) => (
        <div key={month}>
          <p className="text-[11px] font-mono text-[#6E56CF] uppercase tracking-[0.15em] mb-5">{month}</p>
          <div className="space-y-4">
            {groupPhases.map(phase => (
              <div key={phase.id} className="flex gap-4">
                <div className="shrink-0 pt-1">
                  <span className="text-[#3DDC84] text-sm">●</span>
                </div>
                <div className="flex-1 p-4 rounded-xl bg-[#161618] border border-white/[0.06]">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-[#F1F0EE]">{phase.title}</p>
                    <span className="text-[10px] font-mono text-[#5A5955] shrink-0 mt-0.5">
                      {releasedLabel} {formatDate(phase.releaseDate!, locale)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5A5955] mb-3">{phase.subtitle}</p>
                  {phase.items && phase.items.length > 0 && (
                    <ul className="space-y-1">
                      {phase.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-xs text-[#6F6E69]">
                          <span className="text-[#3DDC84] mt-0.5 shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
