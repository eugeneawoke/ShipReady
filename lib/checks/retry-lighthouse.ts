import { createServiceClient } from '@/lib/supabase'
import type { ScanResult, ScanTimings } from '@/types/scan'
import { runLighthouse } from '@/lib/checks/lighthouse'
import { measurement } from '@/lib/checks/issue-meta'
import { buildCategoryScore, buildPerformanceIssues, buildScanResult } from '@/lib/scoring'

async function runWithTimeout<T>(
  task: Promise<T> | (() => Promise<T>),
  timeoutMs: number,
  label: string,
): Promise<{ ok: true; value: T; durationMs: number } | { ok: false; durationMs: number; error: string }> {
  const started = Date.now()
  try {
    const runningTask = typeof task === 'function' ? task() : task
    const value = timeoutMs > 0
      ? await Promise.race([
          runningTask,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)),
        ])
      : await runningTask
    return { ok: true, value, durationMs: Date.now() - started }
  } catch (error) {
    console.error(`[checks] ${label} retry failed:`, error)
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export async function markLighthouseRetryRunning(scanId: string): Promise<ScanResult> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scans')
    .select('results')
    .eq('id', scanId)
    .single()

  const current = data?.results as ScanResult | null
  if (error || !current) {
    throw new Error('Report has no completed checks to retry from')
  }

  const nextResult = buildScanResult({
    ...current,
    phase: 'deep',
    performance: buildCategoryScore([], 'performance', {
      measurement: measurement('Lighthouse mobile audit', 'unavailable', 'Lighthouse retry still running'),
    }),
  })

  const { error: updateError } = await supabase
    .from('scans')
    .update({
      status: 'running_deep',
      results: nextResult,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scanId)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return nextResult
}

export async function retryLighthouseForScan(scanId: string): Promise<void> {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scans')
    .select('url, results')
    .eq('id', scanId)
    .single()

  const current = data?.results as ScanResult | null
  if (error || !data || !current) {
    console.error(`[checks] Lighthouse retry skipped: scan not found or has no results id=${scanId}`)
    return
  }

  const retry = await runWithTimeout(() => runLighthouse(current.url || data.url), 0, 'lighthouse')
  const timings: ScanTimings = {
    ...current.timings,
    lighthouseMs: retry.durationMs,
  }

  const performance = retry.ok
    ? buildCategoryScore(buildPerformanceIssues(retry.value), 'performance', {
        measurement: measurement(
          'Lighthouse mobile audit',
          retry.value.warnings.length > 0 ? 'partial' : 'measured',
          retry.value.warnings.length > 0 ? `Measured with warnings: ${retry.value.warnings.slice(0, 2).join('; ')}` : undefined,
          retry.durationMs,
        ),
      })
    : buildCategoryScore([], 'performance', {
        measurement: measurement('Lighthouse mobile audit', 'unavailable', `Lighthouse retry failed: ${retry.error}`, retry.durationMs),
      })

  const nextResult = buildScanResult({
    ...current,
    phase: 'final',
    timings,
    performance,
    aiSummary: retry.ok ? undefined : current.aiSummary,
    topPriorities: retry.ok ? undefined : current.topPriorities,
    aiTechnicalPrompt: retry.ok ? undefined : current.aiTechnicalPrompt,
    issuePrompts: retry.ok ? undefined : current.issuePrompts,
    wowInsights: retry.ok ? undefined : current.wowInsights,
  })

  const { error: updateError } = await supabase
    .from('scans')
    .update({
      status: 'done',
      results: nextResult,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scanId)

  if (updateError) {
    console.error('[checks] Failed to save Lighthouse retry result:', updateError)
  }
}

export async function finishLighthouseRetryUnavailable(scanId: string, message: string): Promise<void> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scans')
    .select('results')
    .eq('id', scanId)
    .single()

  const current = data?.results as ScanResult | null
  if (!current) return

  const nextResult = buildScanResult({
    ...current,
    phase: 'final',
    performance: buildCategoryScore([], 'performance', {
      measurement: measurement('Lighthouse mobile audit', 'unavailable', message),
    }),
  })

  const { error } = await supabase
    .from('scans')
    .update({
      status: 'done',
      results: nextResult,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scanId)

  if (error) {
    console.error('[checks] Failed to save unavailable Lighthouse retry result:', error)
  }
}
