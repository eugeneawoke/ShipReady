import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildDefaultScanStages,
  failRunningStages,
  resolveStageOutcomeStatus,
  updateScanStage,
} from '../lib/scan/stage-telemetry'

test('buildDefaultScanStages seeds crawl as queued without changing active scan flow', () => {
  const stages = buildDefaultScanStages()

  assert.deepEqual(
    stages.map((stage) => [stage.id, stage.status]),
    [
      ['fast', 'queued'],
      ['crawl', 'queued'],
      ['lighthouse', 'queued'],
      ['enrichment', 'queued'],
    ],
  )
  assert.match(stages[1]?.message ?? '', /not enabled/i)
})

test('resolveStageOutcomeStatus distinguishes done, partial, and failed outcomes', () => {
  assert.equal(resolveStageOutcomeStatus([true, true]), 'done')
  assert.equal(resolveStageOutcomeStatus([true, false]), 'partial')
  assert.equal(resolveStageOutcomeStatus([false, false]), 'failed')
})

test('updateScanStage replaces only the targeted stage and preserves telemetry order', () => {
  const stages = buildDefaultScanStages()
  const next = updateScanStage(stages, 'lighthouse', {
    status: 'running',
    message: 'Lighthouse measurement in progress',
  })

  assert.equal(next[2]?.status, 'running')
  assert.equal(next[2]?.message, 'Lighthouse measurement in progress')
  assert.equal(next[0]?.status, 'queued')
  assert.deepEqual(
    next.map((stage) => stage.id),
    ['fast', 'crawl', 'lighthouse', 'enrichment'],
  )
})

test('failRunningStages converts only in-flight stages to failed', () => {
  const runningStages = updateScanStage(
    updateScanStage(buildDefaultScanStages(), 'lighthouse', { status: 'running' }),
    'enrichment',
    { status: 'done' },
  )

  const failed = failRunningStages(runningStages, 'Stage execution crashed')

  assert.equal(failed[2]?.status, 'failed')
  assert.equal(failed[2]?.message, 'Stage execution crashed')
  assert.equal(failed[3]?.status, 'done')
})
