import { createServiceClient } from '@/lib/supabase'
import type { ScanResult, ScanTimings } from '@/types/scan'
import { buildCategoryScore, buildPerformanceIssues, buildScanResult } from '@/lib/scoring'
import { runLighthouse } from '@/lib/checks/lighthouse'
import { runSEOChecks } from '@/lib/checks/seo'
import { runSecurityChecks } from '@/lib/checks/security'
import { runMobileChecks } from '@/lib/checks/mobile'
import { runLinksCheck } from '@/lib/checks/links'
import { runAIVisibilityChecks } from '@/lib/checks/ai-visibility'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { fetchPrimaryContext } from '@/lib/checks/fetch-context'
import { generateEvidenceEnrichment } from '@/lib/ai/generate-evidence-enrichment'
import { generateWowInsights } from '@/lib/ai/generate-wow-insights'
import { measurement } from '@/lib/checks/issue-meta'

async function safeTask<T>(
  task: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<{ ok: true; value: T; durationMs: number } | { ok: false; durationMs: number; error: string }> {
  const started = Date.now()
  try {
    const value = await Promise.race([
      task,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`${label} timed out`)), timeoutMs)),
    ])
    return { ok: true, value, durationMs: Date.now() - started }
  } catch (error) {
    console.error(`[checks] ${label} failed:`, error)
    return { ok: false, durationMs: Date.now() - started, error: label }
  }
}

async function saveScan(
  scanId: string,
  status: string,
  result?: ScanResult,
) {
  const supabase = createServiceClient()
  const payload: { status: string; results?: ScanResult; updated_at: string } = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (result) payload.results = result
  const { error } = await supabase.from('scans').update(payload).eq('id', scanId)
  if (error) console.error('[checks] Failed to save scan state:', error)
}

async function getPlanForScan(scanId: string): Promise<'free' | 'pro' | 'agency'> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scans')
    .select('user_id')
    .eq('id', scanId)
    .single()

  if (!data?.user_id) return 'free'

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', data.user_id)
    .single()

  return (profile?.plan ?? 'free') as 'free' | 'pro' | 'agency'
}

export async function runAllChecks(url: string, scanId: string): Promise<void> {
  const startedAt = Date.now()
  await saveScan(scanId, 'running_fast')

  try {
    const safeUrl = await assertSafeScanUrl(url)
    const fetchContext = await fetchPrimaryContext(safeUrl)
    const finalUrl = fetchContext.finalUrl || safeUrl
    const timings: ScanTimings = { htmlFetchMs: fetchContext.durationMs }

    const [seoFast, securityFast, mobileFast, aiVisibilityFast] = await Promise.all([
      safeTask(runSEOChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'seo-fast'),
      safeTask(runSecurityChecks(finalUrl, fetchContext.html, fetchContext), 10000, 'security-fast'),
      safeTask(runMobileChecks(fetchContext.html), 4000, 'mobile-fast'),
      safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'ai-visibility-fast'),
    ])

    const fastResult = buildScanResult({
      url: finalUrl,
      phase: 'fast',
      timings: {
        ...timings,
        fastPassMs: Date.now() - startedAt,
      },
      performance: buildCategoryScore([], 'performance', {
        measurement: measurement('Lighthouse mobile audit', 'unavailable', 'Deep performance audit still running'),
      }),
      seo: buildCategoryScore(seoFast.ok ? seoFast.value : [], 'seo'),
      security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
      mobile: buildCategoryScore(mobileFast.ok ? mobileFast.value : [], 'mobile'),
      ai_visibility: buildCategoryScore(aiVisibilityFast.ok ? aiVisibilityFast.value : [], 'ai_visibility'),
    })

    await saveScan(scanId, 'running_deep', fastResult)

    const [lighthouseResult, linksResult, seoDeep, aiVisibilityDeep] = await Promise.all([
      safeTask(runLighthouse(finalUrl), 45_000, 'lighthouse'),
      safeTask(runLinksCheck(finalUrl, fetchContext.html), 12_000, 'links'),
      safeTask(runSEOChecks(finalUrl, fetchContext.html), 10_000, 'seo-deep'),
      safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html), 10_000, 'ai-visibility-deep'),
    ])

    timings.fastPassMs = fastResult.timings?.fastPassMs
    timings.lighthouseMs = lighthouseResult.durationMs
    timings.deepPassMs = Date.now() - startedAt - (timings.fastPassMs ?? 0)

    const performanceIssues = lighthouseResult.ok ? buildPerformanceIssues(lighthouseResult.value) : []
    const seoIssues = seoDeep.ok ? [...seoDeep.value, ...(linksResult.ok ? linksResult.value : [])] : (linksResult.ok ? linksResult.value : [])
    const aiVisibilityIssues = aiVisibilityDeep.ok ? aiVisibilityDeep.value : []

    let result = buildScanResult({
      url: finalUrl,
      phase: 'deep',
      timings,
      performance: buildCategoryScore(performanceIssues, 'performance', {
        measurement: lighthouseResult.ok
          ? measurement('Lighthouse mobile audit', 'measured', undefined, lighthouseResult.durationMs)
          : measurement('Lighthouse mobile audit', 'unavailable', 'Deep performance audit failed', lighthouseResult.durationMs),
      }),
      seo: buildCategoryScore(seoIssues, 'seo', {
        measurement: measurement('SEO audit', 'measured', undefined, seoDeep.durationMs),
      }),
      security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
      mobile: buildCategoryScore(mobileFast.ok ? mobileFast.value : [], 'mobile'),
      ai_visibility: buildCategoryScore(aiVisibilityIssues, 'ai_visibility', {
        measurement: measurement('AI visibility audit', aiVisibilityDeep.ok ? 'measured' : 'partial', aiVisibilityDeep.ok ? undefined : 'Heuristic checks unavailable', aiVisibilityDeep.durationMs),
      }),
    })

    await saveScan(scanId, 'enriching', result)

    if (process.env.OPENAI_API_KEY) {
      const enrichmentStarted = Date.now()
      try {
        const enrichment = await generateEvidenceEnrichment(result)
        timings.aiEnrichmentMs = Date.now() - enrichmentStarted
        result = buildScanResult({
          ...result,
          phase: 'enriching',
          timings,
          aiSummary: enrichment.summary,
          topPriorities: enrichment.topPriorities,
          aiTechnicalPrompt: enrichment.technicalPrompt,
          aiVibePrompt: enrichment.vibePrompt,
          issuePrompts: enrichment.issuePrompts,
        })

        const categories = ['performance', 'seo', 'security', 'mobile', 'ai_visibility'] as const
        for (const category of categories) {
          result[category].issues = result[category].issues.map(issue => {
            const aiPrompt = enrichment.issuePrompts?.[issue.id]
            if (!aiPrompt) return issue
            return {
              ...issue,
              cursorPrompt: aiPrompt.technical || issue.cursorPrompt,
              boltPrompt: aiPrompt.vibe || issue.boltPrompt,
            }
          })
        }

        const plan = await getPlanForScan(scanId)
        if (plan === 'pro' || plan === 'agency') {
          result.wowInsights = await generateWowInsights(result)
        }
      } catch (error) {
        console.error('[checks] AI enrichment failed:', error)
      }
    }

    result = buildScanResult({
      ...result,
      phase: 'final',
      timings: {
        ...timings,
        totalMs: Date.now() - startedAt,
      },
    })

    await saveScan(scanId, 'done', result)
  } catch (error) {
    console.error('[checks] runAllChecks fatal error:', error)
    await saveScan(scanId, 'error')
  }
}
