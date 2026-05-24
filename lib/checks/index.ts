import { createServiceClient } from '@/lib/supabase'
import type { BusinessContext, ScanGoal, ScanPlan, ScanResult, ScanStatus, ScanTimings } from '@/types/scan'
import { buildCategoryScore, buildPerformanceIssues, buildScanResult } from '@/lib/scoring'
import { runLighthouse } from '@/lib/checks/lighthouse'
import { runSEOChecks } from '@/lib/checks/seo'
import { runSecurityChecks } from '@/lib/checks/security'
import { runMobileChecks } from '@/lib/checks/mobile'
import { runLinksCheck } from '@/lib/checks/links'
import { runAIVisibilityChecks } from '@/lib/checks/ai-visibility'
import { runAccessibilityChecks } from '@/lib/checks/accessibility'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { fetchPrimaryContext, fetchSafeResource } from '@/lib/checks/fetch-context'
import { generateEvidenceEnrichment } from '@/lib/ai/generate-evidence-enrichment'
import { generateWowInsights } from '@/lib/ai/generate-wow-insights'
import { generateArtifacts } from '@/lib/ai/generate-artifacts'
import { measurement, withIssueMeta, evidence } from '@/lib/checks/issue-meta'
import { buildMonitoringAlertDecision } from '@/lib/monitoring/alerts'
import { sendMonitoringAlert } from '@/lib/email/send-alert'
import { analyzeBusinessContext } from '@/lib/ai/analyze-business-context'
import { fetchPageSpeedData } from '@/lib/providers/pagespeed'
import { crawlSite } from '@/lib/crawl/engine'
import {
  buildScanStages,
  failRunningStages,
  updateScanStage,
} from '@/lib/scan/stage-telemetry'
import { buildSiteSummary } from '@/lib/scan/aggregation'
import {
  buildScanBudget,
  markProviderState,
  reserveProviderCall,
} from '@/lib/scan/guardrails'
import { getEffectivePlanForUserId } from '@/lib/auth'

async function safeTask<T>(
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
    console.error(`[checks] ${label} failed:`, error)
    return {
      ok: false,
      durationMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const TERMINAL_STATUSES = ['done', 'error']

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
  const { error, count } = await supabase
    .from('scans')
    .update(payload)
    .eq('id', scanId)
    .not('status', 'in', `(${TERMINAL_STATUSES.join(',')})`)
  if (error) console.error('[checks] Failed to save scan state:', error)
  else if (count === 0) console.warn(`[checks] saveScan no-op: scan ${scanId} already in terminal status, attempted status=${status}`)
}

async function getPlanForScan(scanId: string): Promise<ScanPlan> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scans')
    .select('user_id')
    .eq('id', scanId)
    .single()

  if (!data?.user_id) return 'free'

  const { effectivePlan } = await getEffectivePlanForUserId(data.user_id)
  return effectivePlan as ScanPlan
}

async function maybeSendMonitoringAlert(scanId: string, result: ScanResult): Promise<void> {
  const supabase = createServiceClient()
  const { data: scan } = await supabase
    .from('scans')
    .select('baseline_scan_id, monitored_domain_id, trigger')
    .eq('id', scanId)
    .single()

  if (!scan?.monitored_domain_id || scan.trigger !== 'cron') return

  const { data: monitoredDomain } = await supabase
    .from('monitored_domains')
    .select('id, domain, notify_email')
    .eq('id', scan.monitored_domain_id)
    .single()

  if (!monitoredDomain?.notify_email) return

  let previousResult: ScanResult | null = null
  if (scan.baseline_scan_id) {
    const { data: baselineScan } = await supabase
      .from('scans')
      .select('results')
      .eq('id', scan.baseline_scan_id)
      .single()

    previousResult = (baselineScan?.results as ScanResult | null) ?? null
  }

  const decision = buildMonitoringAlertDecision(previousResult, result)
  if (!decision.shouldAlert) return

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'http://localhost:3000'
  await sendMonitoringAlert({
    email: monitoredDomain.notify_email,
    domain: monitoredDomain.domain,
    reportUrl: `${appUrl}/report/${scanId}`,
    scoreDrop: decision.scoreDrop,
    previousScore: decision.previousScore,
    currentScore: decision.currentScore,
    newSeriousIssues: decision.newSeriousIssues,
  })

  const { error } = await supabase
    .from('monitored_domains')
    .update({
      last_alerted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', monitoredDomain.id)

  if (error) {
    console.error('[checks] Failed to persist monitoring alert timestamp:', error)
  }
}

async function finalizeMonitoredDomain(scanId: string): Promise<void> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scans')
    .select('monitored_domain_id')
    .eq('id', scanId)
    .single()

  if (!data?.monitored_domain_id) return

  const { error } = await supabase
    .from('monitored_domains')
    .update({
      last_scan_id: scanId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', data.monitored_domain_id)

  if (error) {
    console.error('[checks] Failed to update monitored domain baseline:', error)
  }
}

export async function runAllChecks(url: string, scanId: string, scanGoal?: ScanGoal, userLocale?: string): Promise<void> {
  const startedAt = Date.now()
  let currentStatus: ScanStatus = 'running_fast'
  let currentStages = updateScanStage(buildScanStages(scanGoal), 'fast', {
    status: 'running',
    message: 'Fast truth checks are running against the fetched page.',
  })
  let latestResult: ScanResult | undefined

  await saveScan(scanId, currentStatus)

  try {
    const plan = await getPlanForScan(scanId)
    let budget = buildScanBudget(plan)
    const safeUrl = await assertSafeScanUrl(url)
    const fetchContext = await fetchPrimaryContext(safeUrl)
    const finalUrl = fetchContext.finalUrl || safeUrl
    const timings: ScanTimings = { htmlFetchMs: fetchContext.durationMs }

    const [seoFast, securityFast, mobileFast, aiVisibilityFast, accessibilityFast, biAnalysis] = await Promise.all([
      safeTask(runSEOChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'seo-fast'),
      safeTask(runSecurityChecks(finalUrl, fetchContext.html, fetchContext), 10000, 'security-fast'),
      safeTask(runMobileChecks(fetchContext.html), 4000, 'mobile-fast'),
      safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html, { includeLikely: false, includeHeuristics: false }), 8000, 'ai-visibility-fast'),
      safeTask(Promise.resolve(runAccessibilityChecks(fetchContext.html)), 4000, 'accessibility-fast'),
      safeTask(
        analyzeBusinessContext(
          fetchContext.html,
          Object.fromEntries(fetchContext.headers.entries()),
        ),
        12000,
        'bi-analysis',
      ),
    ])

    const businessContext: BusinessContext | null = biAnalysis.ok ? biAnalysis.value : null
    currentStages = updateScanStage(currentStages, 'fast', {
      status: 'done',
      message: 'SEO, security, mobile, accessibility, and AI visibility basics were verified from fetched page evidence.',
    })

    if (budget.crawl.enabled && budget.crawl.maxPages > 1) {
      currentStages = updateScanStage(currentStages, 'crawl', {
        status: 'running',
        message: `Bounded crawl is running within same-origin limits (${budget.crawl.maxPages} pages, depth ${budget.crawl.maxDepth}).`,
      })
    } else {
      currentStages = updateScanStage(currentStages, 'lighthouse', {
        status: 'running',
        message: 'Core Web Vitals are being measured via Lighthouse.',
      })
    }

    const fastResult = buildScanResult({
      url: finalUrl,
      phase: 'fast',
      timings: {
        ...timings,
        fastPassMs: Date.now() - startedAt,
      },
      stages: currentStages,
      budget,
      performance: buildCategoryScore([], 'performance', {
        measurement: measurement('Lighthouse mobile audit', 'unavailable', 'Deep performance audit still running'),
      }),
      seo: buildCategoryScore(seoFast.ok ? seoFast.value : [], 'seo'),
      security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
      mobile: buildCategoryScore(mobileFast.ok ? mobileFast.value : [], 'mobile'),
      ai_visibility: buildCategoryScore(aiVisibilityFast.ok ? aiVisibilityFast.value.issues : [], 'ai_visibility'),
      accessibility: buildCategoryScore(accessibilityFast.ok ? accessibilityFast.value : [], 'accessibility'),
      businessContext,
      scanGoal,
    })

    latestResult = fastResult
    currentStatus = 'running_deep'
    await saveScan(scanId, currentStatus, fastResult)

    let siteSummary = fastResult.siteSummary
    if (budget.crawl.enabled && budget.crawl.maxPages > 1) {
      const crawlSnapshot = await safeTask(async () => {
        const crawlResult = await crawlSite({
          startUrl: finalUrl,
          options: {
            maxDepth: budget.crawl.maxDepth,
            maxPages: budget.crawl.maxPages,
            userAgent: 'ShipReadyBot',
          },
          loadRobotsTxt: async (origin) => {
            try {
              const response = await fetchSafeResource(`${origin}/robots.txt`, {
                signal: AbortSignal.timeout(5000),
              })
              if (!response.ok) return null
              return response.text()
            } catch {
              return null
            }
          },
          fetchPage: async (pageUrl) => {
            if (pageUrl === finalUrl) {
              return {
                url: finalUrl,
                html: fetchContext.html,
                status: fetchContext.status,
                headers: fetchContext.headers,
              }
            }

            const context = await fetchPrimaryContext(pageUrl)
            return {
              url: context.finalUrl || context.requestedUrl,
              html: context.html,
              status: context.status,
              headers: context.headers,
            }
          },
        })

        const pageSnapshots = await Promise.all(
          crawlResult.pages.map(async (page) => {
            const seo = await safeTask(
              runSEOChecks(page.url, page.html, { includeLikely: false, includeHeuristics: false }),
              4_000,
              `crawl-seo:${page.url}`,
            )
            return {
              url: page.url,
              issues: seo.ok ? seo.value : [],
            }
          }),
        )

        return {
          crawlResult,
          siteSummary: buildSiteSummary(pageSnapshots),
        }
      }, 20_000, 'bounded-crawl')

      if (crawlSnapshot.ok) {
        siteSummary = crawlSnapshot.value.siteSummary
        currentStages = updateScanStage(currentStages, 'crawl', {
          status: 'done',
          message: `Crawled ${crawlSnapshot.value.crawlResult.pages.length} same-origin pages and summarized recurring SEO issues.`,
        })
      } else {
        currentStages = updateScanStage(currentStages, 'crawl', {
          status: 'failed',
          message: `Bounded crawl failed: ${crawlSnapshot.error}`,
        })
      }

      currentStages = updateScanStage(currentStages, 'lighthouse', {
        status: 'running',
        message: 'Core Web Vitals are being measured via Lighthouse.',
      })
    }

    const [lighthouseResult, linksResult, seoDeep, aiVisibilityDeep] = await Promise.all([
      safeTask(() => runLighthouse(finalUrl), 210_000, 'lighthouse'),
      safeTask(runLinksCheck(finalUrl, fetchContext.html), 12_000, 'links'),
      safeTask(runSEOChecks(finalUrl, fetchContext.html, { businessContext }), 10_000, 'seo-deep'),
      safeTask(runAIVisibilityChecks(finalUrl, fetchContext.html), 10_000, 'ai-visibility-deep'),
    ])

    timings.fastPassMs = fastResult.timings?.fastPassMs
    timings.lighthouseMs = lighthouseResult.durationMs
    timings.deepPassMs = Date.now() - startedAt - (timings.fastPassMs ?? 0)

    const performanceIssues = lighthouseResult.ok ? buildPerformanceIssues(lighthouseResult.value) : []
    const accessibilityIssues = accessibilityFast.ok ? [...accessibilityFast.value] : []
    if (lighthouseResult.ok && lighthouseResult.value.a11yScore !== null) {
      const a11yScore = lighthouseResult.value.a11yScore
      if (a11yScore < 90) {
        accessibilityIssues.push(withIssueMeta({
          id: 'low-a11y-score',
          category: 'accessibility',
          severity: a11yScore < 70 ? 'high' : 'medium',
          title: 'Low Lighthouse accessibility score',
          description: `Accessibility score: ${a11yScore}/100`,
          plainEnglish: `Your site scores ${a11yScore}/100 for accessibility.`,
          fixPrompt: 'Fix the failing Lighthouse accessibility audits and improve semantic structure, labels, and contrast.',
          value: a11yScore,
        }, 'lighthouse', [evidence('metric', 'Accessibility score', a11yScore)]))
      }
    }
    const mobileIssues = mobileFast.ok ? [...mobileFast.value] : []
    if (lighthouseResult.ok) {
      const lh = lighthouseResult.value
      if (lh.tapTargets !== null && lh.tapTargets !== undefined && lh.tapTargets < 0.9) {
        mobileIssues.push(withIssueMeta({
          id: 'small-tap-targets',
          category: 'mobile',
          severity: 'medium',
          title: 'Tap targets are too small for mobile',
          description: 'Some tappable elements are smaller than 48×48px.',
          plainEnglish: 'Buttons and links are too small to tap reliably on mobile devices.',
          fixPrompt: 'Increase the size of all interactive elements to at least 48×48 pixels on mobile breakpoints.',
          value: Math.round(lh.tapTargets * 100),
        }, 'lighthouse', [evidence('metric', 'Tap targets score', Math.round(lh.tapTargets * 100))]))
      }
      if (lh.fontSizeIssues) {
        mobileIssues.push(withIssueMeta({
          id: 'mobile-font-too-small',
          category: 'mobile',
          severity: 'medium',
          title: 'Font sizes are too small for mobile',
          description: 'Some text is below 12px and may be unreadable without zooming.',
          plainEnglish: 'Text on your page is too small to read comfortably on mobile.',
          fixPrompt: 'Set a minimum font size of 12px for all text content, especially at small-screen breakpoints.',
          value: 'failing',
        }, 'lighthouse', [evidence('metric', 'Font size audit', 'failing')]))
      }
    }
    const seoIssues = seoDeep.ok ? [...seoDeep.value, ...(linksResult.ok ? linksResult.value : [])] : (linksResult.ok ? linksResult.value : [])
    const aiVisibilityIssues = aiVisibilityDeep.ok ? aiVisibilityDeep.value.issues : []
    const aiPlatformReadiness = aiVisibilityDeep.ok
      ? aiVisibilityDeep.value.platformReadiness
      : (aiVisibilityFast.ok ? aiVisibilityFast.value.platformReadiness : undefined)
    const lighthouseStageStatus = lighthouseResult.ok
      ? (lighthouseResult.value.warnings.length > 0 ? 'partial' : 'done')
      : 'failed'
    currentStages = updateScanStage(currentStages, 'lighthouse', {
      status: lighthouseStageStatus,
      message: lighthouseResult.ok
        ? (
          lighthouseResult.value.warnings.length > 0
            ? `Measured with warnings: ${lighthouseResult.value.warnings.slice(0, 2).join('; ')}`
            : 'Performance data was measured by Lighthouse.'
        )
        : `Deep performance audit failed: ${lighthouseResult.error}`,
      durationMs: lighthouseResult.durationMs,
    })

    let result = buildScanResult({
      url: finalUrl,
      phase: 'deep',
      timings,
      performance: buildCategoryScore(performanceIssues, 'performance', {
        measurement: lighthouseResult.ok
          ? measurement(
              'Lighthouse mobile audit',
              lighthouseResult.value.warnings.length > 0 ? 'partial' : 'measured',
              lighthouseResult.value.warnings.length > 0 ? `Measured with warnings: ${lighthouseResult.value.warnings.slice(0, 2).join('; ')}` : undefined,
              lighthouseResult.durationMs,
            )
          : measurement('Lighthouse mobile audit', 'unavailable', `Deep performance audit failed: ${lighthouseResult.error}`, lighthouseResult.durationMs),
      }),
      seo: buildCategoryScore(seoIssues, 'seo', {
        measurement: measurement('SEO audit', 'measured', undefined, seoDeep.durationMs),
      }),
      security: buildCategoryScore(securityFast.ok ? securityFast.value : [], 'security'),
      mobile: buildCategoryScore(mobileIssues, 'mobile'),
      ai_visibility: buildCategoryScore(aiVisibilityIssues, 'ai_visibility', {
        measurement: measurement('AI visibility audit', aiVisibilityDeep.ok ? 'measured' : 'partial', aiVisibilityDeep.ok ? undefined : 'Heuristic checks unavailable', aiVisibilityDeep.durationMs),
      }),
      accessibility: buildCategoryScore(accessibilityIssues, 'accessibility', {
        measurement: lighthouseResult.ok
          ? measurement('Accessibility audit', 'measured', undefined, lighthouseResult.durationMs)
          : measurement('Accessibility audit', 'partial', 'Lighthouse a11y score unavailable'),
      }),
      businessContext,
      scanGoal,
      stages: currentStages,
      budget,
      siteSummary,
      aiPlatformReadiness,
    })

    let providerData = result.providerData
    const pageSpeedBudgetReservation = reserveProviderCall(budget, 'pagespeed')
    budget = pageSpeedBudgetReservation.budget
    if (pageSpeedBudgetReservation.allowed) {
      const pageSpeed = await fetchPageSpeedData(finalUrl, {
        apiKey: process.env.PAGESPEED_API_KEY,
      })

      if (pageSpeed.ok) {
        budget = markProviderState(budget, 'pagespeed', 'done', 'Google PageSpeed Insights data captured.')
        providerData = {
          ...providerData,
          pagespeed: pageSpeed.data,
        }
      } else {
        budget = markProviderState(budget, 'pagespeed', pageSpeed.status, pageSpeed.message)
      }

      result = buildScanResult({
        ...result,
        budget,
        providerData,
        siteSummary,
        businessContext,
        scanGoal,
      })
    }

    latestResult = result
    currentStatus = 'enriching'
    currentStages = updateScanStage(currentStages, 'enrichment', {
      status: 'running',
      message: 'AI enrichment is running against the verified scan evidence.',
    })
    result = buildScanResult({
      ...result,
      phase: 'enriching',
      stages: currentStages,
      budget,
      providerData,
      businessContext,
      scanGoal,
    })
    latestResult = result
    await saveScan(scanId, currentStatus, result)

    if (process.env.OPENAI_API_KEY) {
      const aiBudgetReservation = reserveProviderCall(budget, 'aiEnrichment')
      budget = aiBudgetReservation.budget

      if (aiBudgetReservation.allowed) {
        const enrichment = await safeTask(
          generateEvidenceEnrichment(result, businessContext, scanGoal, userLocale),
          35_000,
          'ai-enrichment',
        )
        timings.aiEnrichmentMs = enrichment.durationMs

        if (enrichment.ok) {
          budget = markProviderState(budget, 'aiEnrichment', 'done', 'Evidence-grounded enrichment completed.')
          currentStages = updateScanStage(currentStages, 'enrichment', {
            status: 'done',
            message: 'Final summary and fix prompts are available.',
            durationMs: enrichment.durationMs,
          })
          result = buildScanResult({
            ...result,
            phase: 'enriching',
            timings,
            stages: currentStages,
            budget,
            providerData,
            siteSummary,
            aiSummary: enrichment.value.summary,
            topPriorities: enrichment.value.topPriorities,
            strategicRecommendations: enrichment.value.strategicRecommendations,
            aiTechnicalPrompt: enrichment.value.technicalPrompt,
            issuePrompts: enrichment.value.issuePrompts,
            businessContext,
            scanGoal,
          })

          const categories = ['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility'] as const
          for (const category of categories) {
            result[category].issues = result[category].issues.map(issue => {
              const aiPrompt = enrichment.value.issuePrompts?.[issue.id]
              if (!aiPrompt) return issue
              return {
                ...issue,
                fixPrompt: aiPrompt.technical || issue.fixPrompt,
              }
            })
          }

          if (plan === 'pro' || plan === 'agency') {
            const wowBudgetReservation = reserveProviderCall(budget, 'wowInsights')
            budget = wowBudgetReservation.budget
            if (wowBudgetReservation.allowed) {
              const wowInsights = await safeTask(generateWowInsights(result), 35_000, 'wow-insights')
              if (wowInsights.ok) {
                budget = markProviderState(budget, 'wowInsights', 'done', 'Premium wow insights completed.')
                result.wowInsights = wowInsights.value
              } else {
                budget = markProviderState(budget, 'wowInsights', 'failed', `Wow insights failed: ${wowInsights.error}`)
              }
            }
          }
        } else {
          budget = markProviderState(budget, 'aiEnrichment', 'failed', `AI enrichment failed: ${enrichment.error}`)
          currentStages = updateScanStage(currentStages, 'enrichment', {
            status: 'failed',
            message: `AI enrichment failed: ${enrichment.error}`,
            durationMs: enrichment.durationMs,
          })
        }
      } else {
        currentStages = updateScanStage(currentStages, 'enrichment', {
          status: 'partial',
          message: 'AI enrichment was skipped because the per-scan provider budget was exhausted.',
        })
      }
    } else {
      budget = markProviderState(budget, 'aiEnrichment', 'unavailable', 'OPENAI_API_KEY is not configured.')
      currentStages = updateScanStage(currentStages, 'enrichment', {
        status: 'partial',
        message: 'AI enrichment was skipped because OPENAI_API_KEY is not configured.',
      })
    }

    const generatedArtifacts = generateArtifacts(result, businessContext)

    result = buildScanResult({
      ...result,
      phase: 'final',
      timings: {
        ...timings,
        totalMs: Date.now() - startedAt,
      },
      stages: currentStages,
      budget,
      providerData,
      siteSummary,
      businessContext,
      scanGoal,
      generatedArtifacts,
    })

    latestResult = result
    await saveScan(scanId, 'done', result)
    await maybeSendMonitoringAlert(scanId, result)
    await finalizeMonitoredDomain(scanId)
  } catch (error) {
    console.error('[checks] runAllChecks fatal error:', error)
    if (latestResult) {
      const failedStages = failRunningStages(currentStages, 'Stage execution crashed before completion.')
      const message = currentStatus === 'enriching'
        ? 'The scan failed while writing the AI-assisted report.'
        : currentStatus === 'running_deep'
          ? 'The scan failed while running deep analysis.'
          : 'The scan failed while running fast truth checks.'

      const errorResult = buildScanResult({
        ...latestResult,
        phase: 'final',
        stages: failedStages,
        processingIssue: {
          kind: 'stage_failure',
          stage: currentStatus,
          staleAgeSeconds: 0,
          message,
          recommendation: 'Run the scan again. If it fails again, send us this report URL so we can inspect the scanner logs.',
        },
        budget: latestResult.budget,
        providerData: latestResult.providerData,
        siteSummary: latestResult.siteSummary,
        businessContext: latestResult.businessContext,
        scanGoal: latestResult.scanGoal,
      })

      await saveScan(scanId, 'error', errorResult)
      return
    }

    await saveScan(scanId, 'error')
  }
}
