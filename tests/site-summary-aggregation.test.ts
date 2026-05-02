import test from 'node:test'
import assert from 'node:assert/strict'

import { buildSiteSummary } from '../lib/scan/aggregation'

test('buildSiteSummary groups recurring issues by id and excludes single occurrences', () => {
  const summary = buildSiteSummary([
    {
      url: 'https://example.com/',
      issues: [
        { id: 'missing-title', title: 'Missing title', category: 'seo' },
        { id: 'missing-description', title: 'Missing description', category: 'seo' },
      ],
    },
    {
      url: 'https://example.com/about',
      issues: [
        { id: 'missing-title', title: 'Missing title', category: 'seo' },
      ],
    },
    {
      url: 'https://example.com/pricing',
      issues: [
        { id: 'missing-title', title: 'Missing title', category: 'seo' },
      ],
    },
  ])

  assert.equal(summary.pagesCrawled, 3)
  assert.deepEqual(summary.recurringIssues, [
    {
      issueId: 'missing-title',
      title: 'Missing title',
      category: 'seo',
      occurrenceCount: 3,
      urls: [
        'https://example.com/',
        'https://example.com/about',
        'https://example.com/pricing',
      ],
    },
  ])
})
