import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildScanBudget,
  markProviderState,
  reserveProviderCall,
} from '../lib/scan/guardrails'

test('buildScanBudget returns plan-based crawl and provider limits', () => {
  const free = buildScanBudget('free')
  const agency = buildScanBudget('agency')

  assert.deepEqual(free.crawl, {
    enabled: false,
    maxDepth: 0,
    maxPages: 1,
  })
  assert.deepEqual(agency.crawl, {
    enabled: true,
    maxDepth: 2,
    maxPages: 10,
  })
  assert.equal(free.providers.wowInsights.maxCalls, 0)
  assert.equal(agency.providers.wowInsights.maxCalls, 1)
})

test('reserveProviderCall blocks providers once the per-scan budget is exhausted', () => {
  let budget = buildScanBudget('pro')

  const first = reserveProviderCall(budget, 'aiEnrichment')
  budget = first.budget
  const second = reserveProviderCall(budget, 'aiEnrichment')

  assert.equal(first.allowed, true)
  assert.equal(second.allowed, false)
  assert.equal(second.reason, 'budget_exhausted')
  assert.equal(second.budget.providers.aiEnrichment.status, 'blocked')
})

test('markProviderState records explicit unavailable fallback for missing credentials', () => {
  const budget = markProviderState(
    buildScanBudget('free'),
    'pagespeed',
    'unavailable',
    'PAGESPEED_API_KEY is not configured.',
  )

  assert.equal(budget.providers.pagespeed.status, 'unavailable')
  assert.equal(budget.providers.pagespeed.message, 'PAGESPEED_API_KEY is not configured.')
})
