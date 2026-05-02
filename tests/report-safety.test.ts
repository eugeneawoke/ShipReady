import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  issueBody,
  issueConfidenceLabel,
  issueEvidenceLine,
  issueSeverityLabel,
  issueTitle,
  normalizeStrategicRecommendationsForDisplay,
  strategicTimeframeLabel,
} from '@/lib/report/report-safety'
import type { Issue } from '@/types/scan'

describe('report safety helpers', () => {
  it('renders incomplete legacy issues without throwing', () => {
    const issue = {
      id: 'legacy_issue',
      evidence: [{ kind: 'text', label: '', value: undefined }],
    } as unknown as Issue

    assert.equal(issueSeverityLabel(issue), 'UNKNOWN')
    assert.equal(issueConfidenceLabel(issue), 'unknown')
    assert.equal(issueTitle(issue), 'legacy_issue')
    assert.equal(issueBody(issue), 'No issue details were provided.')
    assert.equal(issueEvidenceLine(issue), ' Evidence: Evidence: unknown.')
  })

  it('uses available issue text before falling back', () => {
    const issue = {
      severity: 'high',
      confidence: 'verified',
      title: 'Missing canonical',
      description: 'No canonical tag was detected.',
    } as Issue

    assert.equal(issueSeverityLabel(issue), 'HIGH')
    assert.equal(issueConfidenceLabel(issue), 'verified')
    assert.equal(issueTitle(issue), 'Missing canonical')
    assert.equal(issueBody(issue), 'No canonical tag was detected.')
  })

  it('filters malformed strategic recommendations for display', () => {
    const recommendations = normalizeStrategicRecommendationsForDisplay([
      { timeframe: 'now', title: 'Fix indexability', body: 'Remove noindex from core pages.' },
      { timeframe: 'later', title: 'Invalid timeframe', body: 'Skip this.' },
      { timeframe: 'next_month', title: '', body: 'Skip empty title.' },
    ])

    assert.equal(recommendations.length, 1)
    assert.equal(recommendations[0].title, 'Fix indexability')
    assert.equal(strategicTimeframeLabel(recommendations[0].timeframe), 'Now')
  })
})
