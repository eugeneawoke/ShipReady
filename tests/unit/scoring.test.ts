import { describe, it, expect } from 'vitest'

// Mirror of getScoreColor from components/report/ScoreRing.tsx
function getScoreColor(score: number | null): string {
  if (score === null) return '#8B8A85'
  if (score >= 90) return '#3DDC84'
  if (score >= 70) return '#7BC67E'
  if (score >= 50) return '#F5C518'
  return '#FF4444'
}

describe('getScoreColor', () => {
  it('null → muted grey', () => {
    expect(getScoreColor(null)).toBe('#8B8A85')
  })

  it('100 → bright green', () => {
    expect(getScoreColor(100)).toBe('#3DDC84')
  })

  it('90 → bright green (boundary)', () => {
    expect(getScoreColor(90)).toBe('#3DDC84')
  })

  it('89 → light green', () => {
    expect(getScoreColor(89)).toBe('#7BC67E')
  })

  it('70 → light green (boundary)', () => {
    expect(getScoreColor(70)).toBe('#7BC67E')
  })

  it('69 → yellow', () => {
    expect(getScoreColor(69)).toBe('#F5C518')
  })

  it('50 → yellow (boundary)', () => {
    expect(getScoreColor(50)).toBe('#F5C518')
  })

  it('49 → red', () => {
    expect(getScoreColor(49)).toBe('#FF4444')
  })

  it('0 → red', () => {
    expect(getScoreColor(0)).toBe('#FF4444')
  })
})
