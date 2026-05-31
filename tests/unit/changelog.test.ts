import { describe, it, expect } from 'vitest'

// Mirror of changelog filtering/sorting logic from ChangelogView.tsx
interface Phase {
  id: string
  title: string
  subtitle: string
  status: string
  releaseDate?: string
  items: string[]
}

function filterAndSort(phases: Phase[]) {
  return phases
    .filter(p => p.status === 'done' && p.releaseDate)
    .sort((a, b) => new Date(b.releaseDate!).getTime() - new Date(a.releaseDate!).getTime())
}

function groupByMonth(phases: Phase[], locale: string): Record<string, Phase[]> {
  const groups: Record<string, Phase[]> = {}
  for (const p of phases) {
    const key = new Date(p.releaseDate!).toLocaleDateString(
      locale === 'ru' ? 'ru-RU' : 'en-US',
      { year: 'numeric', month: 'long' }
    )
    if (!groups[key]) groups[key] = []
    groups[key].push(p)
  }
  return groups
}

const PHASES: Phase[] = [
  { id: '01', title: 'Scanner Engine', subtitle: 'Done', status: 'done', releaseDate: '2026-05-07', items: [] },
  { id: '04', title: 'Growth & Quality', subtitle: 'Done', status: 'done', releaseDate: '2026-05-28', items: [] },
  { id: '05', title: 'Beta Launch', subtitle: 'WIP', status: 'in-progress', items: [] },
  { id: '06', title: 'Public Launch', subtitle: 'Planned', status: 'planned', items: [] },
  { id: '07', title: 'No Date', subtitle: 'Done but no date', status: 'done', items: [] },
]

describe('changelog filtering', () => {
  it('only done phases with releaseDate pass filter', () => {
    const result = filterAndSort(PHASES)
    expect(result).toHaveLength(2)
    expect(result.map(p => p.id)).toEqual(['04', '01']) // newest first
  })

  it('sorted newest first', () => {
    const result = filterAndSort(PHASES)
    expect(result[0].releaseDate).toBe('2026-05-28')
    expect(result[1].releaseDate).toBe('2026-05-07')
  })

  it('in-progress phases excluded', () => {
    const result = filterAndSort(PHASES)
    expect(result.find(p => p.status === 'in-progress')).toBeUndefined()
  })

  it('planned phases excluded', () => {
    const result = filterAndSort(PHASES)
    expect(result.find(p => p.status === 'planned')).toBeUndefined()
  })

  it('done phases WITHOUT releaseDate excluded, no crash', () => {
    const result = filterAndSort(PHASES)
    expect(result.find(p => p.id === '07')).toBeUndefined()
  })

  it('empty phases array returns empty', () => {
    expect(filterAndSort([])).toHaveLength(0)
  })
})

describe('changelog groupByMonth', () => {
  it('groups phases by month-year in en locale', () => {
    const sorted = filterAndSort(PHASES)
    const groups = groupByMonth(sorted, 'en')
    expect(Object.keys(groups)).toHaveLength(1) // both in May 2026
    expect(Object.keys(groups)[0]).toContain('May')
  })
})
