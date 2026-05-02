import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchPageSpeedData } from '../lib/providers/pagespeed'

test('fetchPageSpeedData returns unavailable when the API key is missing', async () => {
  const result = await fetchPageSpeedData('https://example.com', { apiKey: '' })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.status, 'unavailable')
  assert.match(result.message, /not configured/i)
})

test('fetchPageSpeedData returns failed when the provider responds with an error', async () => {
  const result = await fetchPageSpeedData('https://example.com', {
    apiKey: 'test-key',
    fetchImpl: async () => new Response(
      JSON.stringify({ error: { message: 'quota exceeded' } }),
      {
        status: 429,
        headers: { 'content-type': 'application/json' },
      },
    ),
  })

  assert.equal(result.ok, false)
  if (result.ok) return
  assert.equal(result.status, 'failed')
  assert.match(result.message, /quota exceeded/i)
})

test('fetchPageSpeedData extracts provenance and field data on success', async () => {
  const result = await fetchPageSpeedData('https://example.com', {
    apiKey: 'test-key',
    fetchImpl: async () => new Response(
      JSON.stringify({
        id: 'https://pagespeed.web.dev/analysis/https-example-com/demo',
        originLoadingExperience: {
          id: 'https://example.com',
          metrics: {
            LARGEST_CONTENTFUL_PAINT_MS: { percentile: 2400 },
            INTERACTION_TO_NEXT_PAINT: { percentile: 180 },
            CUMULATIVE_LAYOUT_SHIFT_SCORE: { percentile: 8 },
          },
        },
        lighthouseResult: {
          categories: {
            performance: { score: 0.91 },
          },
        },
      }),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    ),
  })

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.data.source, 'google-pagespeed-insights')
  assert.equal(result.data.strategy, 'mobile')
  assert.equal(result.data.analysisUrl, 'https://pagespeed.web.dev/analysis/https-example-com/demo')
  assert.equal(result.data.origin, 'https://example.com')
  assert.equal(result.data.performanceScore, 91)
  assert.equal(result.data.fieldMetrics.lcpMs, 2400)
  assert.equal(result.data.fieldMetrics.inpMs, 180)
  assert.equal(result.data.fieldMetrics.cls, 0.08)
})
