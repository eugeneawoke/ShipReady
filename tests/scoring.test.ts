import test from 'node:test'
import assert from 'node:assert/strict'
import type { CategoryScore, ScanStage } from '../types/scan'
import { buildCategoryScore, buildScanResult } from '../lib/scoring'

function category(): CategoryScore {
  return {
    score: 100,
    label: 'excellent',
    issues: [],
    passedChecks: 1,
    totalChecks: 1,
    measurement: { label: 'test', status: 'measured' },
  }
}

test('strategic recommendations are preserved without changing score or confidence counts', () => {
  const result = buildScanResult({
    url: 'https://example.com',
    phase: 'final',
    performance: category(),
    seo: category(),
    security: category(),
    mobile: category(),
    ai_visibility: category(),
    strategicRecommendations: [
      {
        timeframe: 'next_2_weeks',
        title: 'Create a sample report page',
        body: 'Expose a public demo report so agency buyers can inspect the deliverable before signing up.',
        evidenceRefs: ['businessContext:agency'],
      },
    ],
  })

  assert.equal(result.totalScore, 100)
  assert.deepEqual(result.confidenceSummary, { verified: 0, likely: 0, heuristic: 0 })
  assert.equal(result.strategicRecommendations?.[0]?.timeframe, 'next_2_weeks')
})

test('stage telemetry is preserved without affecting score output', () => {
  const stages: ScanStage[] = [
    {
      id: 'fast',
      label: 'Fast truth checks',
      status: 'done',
      message: 'Completed from fetched page evidence.',
    },
    {
      id: 'crawl',
      label: 'Site crawl',
      status: 'queued',
      message: 'Bounded crawl is not enabled for this scan yet.',
    },
  ]

  const result = buildScanResult({
    url: 'https://example.com',
    phase: 'final',
    performance: category(),
    seo: category(),
    security: category(),
    mobile: category(),
    ai_visibility: category(),
    stages,
  })

  assert.equal(result.totalScore, 100)
  assert.deepEqual(result.stages, stages)
})

test('only verified score-eligible issues reduce score', () => {
  const categoryScore = buildCategoryScore([
    {
      id: 'verified-issue',
      category: 'performance',
      severity: 'high',
      title: 'Verified issue',
      description: 'Counts against score.',
      plainEnglish: 'Counts against score.',
      fixPrompt: 'Fix it.',
      confidence: 'verified',
      scoreEligible: true,
    },
    {
      id: 'likely-issue',
      category: 'performance',
      severity: 'critical',
      title: 'Likely issue',
      description: 'Must not count against score.',
      plainEnglish: 'Must not count against score.',
      fixPrompt: 'Investigate it.',
      confidence: 'likely',
      scoreEligible: true,
    },
  ], 'performance', {
    measurement: { label: 'test', status: 'measured' },
  })

  assert.equal(categoryScore.score, 85)
})
