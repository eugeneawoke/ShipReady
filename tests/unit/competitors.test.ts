import { describe, it, expect } from 'vitest'
import { competitors, competitorSlugs } from '@/lib/vs/competitors'

const REQUIRED_SLUGS = ['ahrefs', 'screaming-frog', 'semrush', 'se-ranking', 'otterly']

describe('competitors data', () => {
  it('has all 5 required slugs', () => {
    expect(competitorSlugs).toHaveLength(5)
    for (const slug of REQUIRED_SLUGS) {
      expect(competitorSlugs).toContain(slug)
    }
  })

  it.each(REQUIRED_SLUGS)('%s — has required fields', (slug) => {
    const c = competitors[slug]
    expect(c).toBeDefined()
    expect(c.name).toBeTruthy()
    expect(c.tagline).toBeTruthy()
    expect(c.pricingRange).toBeTruthy()
    expect(c.verdict).toBeTruthy()
  })

  it.each(REQUIRED_SLUGS)('%s — features array has ≥ 10 rows', (slug) => {
    expect(competitors[slug].features.length).toBeGreaterThanOrEqual(10)
  })

  it.each(REQUIRED_SLUGS)('%s — has exactly 3 FAQ items', (slug) => {
    const faq = competitors[slug].faq
    expect(faq).toHaveLength(3)
    for (const item of faq) {
      expect(item.q).toBeTruthy()
      expect(item.a).toBeTruthy()
    }
  })

  it.each(REQUIRED_SLUGS)('%s — has weaknesses array', (slug) => {
    expect(competitors[slug].weaknesses.length).toBeGreaterThan(0)
  })

  it('Glook feature value is never null/undefined', () => {
    for (const slug of REQUIRED_SLUGS) {
      for (const f of competitors[slug].features) {
        expect(f.shipready).not.toBeUndefined()
        expect(f.shipready).not.toBeNull()
      }
    }
  })
})
