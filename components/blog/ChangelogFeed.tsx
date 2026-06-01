import { changelog } from '@/lib/changelog'
import type { ChangelogEntry } from '@/lib/changelog'

const CATEGORY_COLORS: Record<ChangelogEntry['category'], string> = {
  feature: '#3DDC84',
  improvement: '#4A9EFF',
  security: '#FF4444',
  infrastructure: '#F5C518',
}

const CATEGORY_LABELS: Record<ChangelogEntry['category'], string> = {
  feature: 'New',
  improvement: 'Improved',
  security: 'Security',
  infrastructure: 'Infrastructure',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function groupByMonth(entries: ChangelogEntry[]): Record<string, ChangelogEntry[]> {
  const groups: Record<string, ChangelogEntry[]> = {}
  for (const entry of entries) {
    const key = new Date(entry.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    if (!groups[key]) groups[key] = []
    groups[key].push(entry)
  }
  return groups
}

export function ChangelogFeed() {
  const sorted = [...changelog].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const groups = groupByMonth(sorted)

  return (
    <div className="space-y-12">
      {Object.entries(groups).map(([month, entries]) => (
        <div key={month}>
          <p className="text-[11px] font-mono text-[#6E56CF] uppercase tracking-[0.15em] mb-6">{month}</p>
          <div className="space-y-5">
            {entries.map(entry => (
              <div key={entry.date + entry.title} className="flex gap-4">
                <div className="shrink-0 pt-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ backgroundColor: CATEGORY_COLORS[entry.category] }}
                  />
                </div>
                <div className="flex-1 p-5 rounded-xl bg-[#161618] border border-white/[0.06]">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                        style={{
                          color: CATEGORY_COLORS[entry.category],
                          borderColor: `${CATEGORY_COLORS[entry.category]}30`,
                          backgroundColor: `${CATEGORY_COLORS[entry.category]}10`,
                        }}
                      >
                        {CATEGORY_LABELS[entry.category]}
                      </span>
                      <p className="text-sm font-medium text-[#F1F0EE]">{entry.title}</p>
                    </div>
                    <span className="text-[10px] font-mono text-[#5A5955] shrink-0">{formatDate(entry.date)}</span>
                  </div>
                  <p className="text-xs text-[#8B8A85] mb-3 leading-relaxed">{entry.summary}</p>
                  <ul className="space-y-1">
                    {entry.items.map(item => (
                      <li key={item} className="flex items-start gap-2 text-xs text-[#6F6E69]">
                        <span className="shrink-0 mt-0.5" style={{ color: CATEGORY_COLORS[entry.category] }}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
