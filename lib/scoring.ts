import type {
  BusinessContext,
  ScanBudget,
  CategoryScore,
  Issue,
  IssueSeverity,
  MeasurementState,
  ScanGoal,
  ScanPhase,
  ScanProcessingIssue,
  ScanProviderData,
  ScanResult,
  ScanStage,
  ScanTimings,
} from '@/types/scan'
import { measurement, withIssueMeta, evidence } from '@/lib/checks/issue-meta'
import type { LighthouseMetrics } from '@/lib/checks/lighthouse'

const DEDUCTIONS: Record<IssueSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 3,
  pass: 0,
}

const TOTAL_CHECKS = {
  performance: 6,  // lcp, cls, inp, fcp, perf-score, a11y-score
  seo: 16,         // title, description, h1, canonical, social tags, robots/indexability, images, placeholder, links
  security: 10,    // https, hsts, x-frame, xcto, referrer-policy, csp, ssl, exposed-env, api-key, mixed-content
  mobile: 3,       // viewport, favicon, apple-touch-icon
  ai_visibility: 8, // schema-org, faq-schema, heading-hierarchy, thin-content, llms-txt, ai-crawlers, sitemap, author-entity
}

const CATEGORY_WEIGHTS = {
  performance: 0.25,
  seo: 0.20,
  security: 0.25,
  mobile: 0.10,
  ai_visibility: 0.20,
} as const

// "Excellent" requires both a high numeric score AND no visible issues of any kind.
// A category with even one likely/heuristic issue is at most "Good" — showing
// "Excellent" alongside a visible warning is misleading.
function scoreLabel(score: number | null, hasAnyIssues: boolean): CategoryScore['label'] {
  if (score === null) return 'unavailable'
  if (score >= 90 && !hasAnyIssues) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs-work'
  return 'poor'
}

export function buildCategoryScore(
  issues: Issue[],
  category: keyof typeof TOTAL_CHECKS,
  options?: { measurement?: MeasurementState },
): CategoryScore {
  const measurementState = options?.measurement ?? measurement(category, 'measured')
  const scorableIssues = issues.filter(issue => issue.scoreEligible && issue.confidence === 'verified')
  const deduction = scorableIssues.reduce((sum, issue) => sum + DEDUCTIONS[issue.severity], 0)
  const score = measurementState.status === 'unavailable' ? null : Math.max(0, 100 - deduction)
  const totalChecks = TOTAL_CHECKS[category]

  return {
    score,
    label: scoreLabel(score, issues.length > 0),
    issues,
    passedChecks: measurementState.status === 'unavailable' ? 0 : Math.max(0, totalChecks - issues.length),
    totalChecks,
    measurement: measurementState,
  }
}

export function getAllIssues(result: ScanResult): Issue[] {
  return [
    ...result.performance.issues,
    ...result.seo.issues,
    ...result.security.issues,
    ...result.mobile.issues,
    ...result.ai_visibility.issues,
  ]
}

export function countConfidence(result: ScanResult) {
  return getAllIssues(result).reduce(
    (summary, issue) => {
      if (issue.confidence === 'verified') summary.verified += 1
      else if (issue.confidence === 'likely') summary.likely += 1
      else summary.heuristic += 1
      return summary
    },
    { verified: 0, likely: 0, heuristic: 0 },
  )
}

function weightedTotal(result: Omit<ScanResult, 'totalScore' | 'confidenceSummary'>): number | null {
  const available = (Object.keys(CATEGORY_WEIGHTS) as Array<keyof typeof CATEGORY_WEIGHTS>).reduce<Array<{ score: number; weight: number }>>(
    (acc, key) => {
      const score = result[key].score
      if (score !== null) {
        acc.push({ score, weight: CATEGORY_WEIGHTS[key] })
      }
      return acc
    },
    [],
  )

  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, entry) => sum + entry.weight, 0)
  const score = available.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / totalWeight
  return Math.round(score)
}

export function buildPerformanceIssues(lh: LighthouseMetrics): Issue[] {
  const issues: Issue[] = []

  if (lh.lcp !== null && lh.lcp > 2500) {
    issues.push(withIssueMeta({
      id: 'lcp-slow',
      category: 'performance',
      severity: 'high',
      title: 'Largest Contentful Paint is too slow',
      description: `LCP is ${(lh.lcp / 1000).toFixed(1)}s`,
      plainEnglish: `Your page takes ${(lh.lcp / 1000).toFixed(1)}s to show the main content. Google's target is under 2.5s.`,
      cursorPrompt: 'Optimize Largest Contentful Paint: lazy load below-the-fold assets, prioritize the hero asset, and remove render-blocking work.',
      value: `${(lh.lcp / 1000).toFixed(1)}s`,
    }, 'lighthouse', [evidence('metric', 'LCP', `${(lh.lcp / 1000).toFixed(1)}s`) ]))
  }

  if (lh.cls !== null && lh.cls > 0.1) {
    issues.push(withIssueMeta({
      id: 'cls-high',
      category: 'performance',
      severity: 'high',
      title: 'Layout shifts detected',
      description: `CLS score is ${lh.cls.toFixed(3)}`,
      plainEnglish: 'Your page layout shifts during load. This makes the page feel unstable and hurts Core Web Vitals.',
      cursorPrompt: 'Reserve space for images and embeds, avoid injecting content above existing content, and stabilize font/layout loading.',
      value: lh.cls.toFixed(3),
    }, 'lighthouse', [evidence('metric', 'CLS', lh.cls.toFixed(3))]))
  }

  if (lh.inp !== null && lh.inp > 200) {
    issues.push(withIssueMeta({
      id: 'inp-slow',
      category: 'performance',
      severity: 'medium',
      title: 'Interaction response is slow',
      description: `INP is ${lh.inp}ms`,
      plainEnglish: `Your page takes ${lh.inp}ms to react to interactions. Target is under 200ms.`,
      cursorPrompt: 'Break up long tasks, defer non-critical work, and reduce main-thread blocking during interaction.',
      value: `${lh.inp}ms`,
    }, 'lighthouse', [evidence('metric', 'INP', `${lh.inp}ms`) ]))
  }

  if (lh.fcp !== null && lh.fcp > 1800) {
    issues.push(withIssueMeta({
      id: 'fcp-slow',
      category: 'performance',
      severity: 'medium',
      title: 'First paint is slow',
      description: `FCP is ${(lh.fcp / 1000).toFixed(1)}s`,
      plainEnglish: `Your page takes ${(lh.fcp / 1000).toFixed(1)}s before users see anything. Target is under 1.8s.`,
      cursorPrompt: 'Reduce render-blocking work, preload critical assets, and improve first response rendering.',
      value: `${(lh.fcp / 1000).toFixed(1)}s`,
    }, 'lighthouse', [evidence('metric', 'FCP', `${(lh.fcp / 1000).toFixed(1)}s`) ]))
  }

  if (lh.performanceScore < 70) {
    issues.push(withIssueMeta({
      id: 'perf-score-low',
      category: 'performance',
      severity: 'high',
      title: 'Low Lighthouse performance score',
      description: `Performance score: ${lh.performanceScore}/100`,
      plainEnglish: `Google rates your page ${lh.performanceScore}/100 for performance. This suggests users are paying a noticeable speed penalty.`,
      cursorPrompt: 'Use the Lighthouse trace to remove top performance bottlenecks and improve the mobile score above 70.',
      value: lh.performanceScore,
    }, 'lighthouse', [evidence('metric', 'Performance score', lh.performanceScore)]))
  }

  if (lh.a11yScore !== null && lh.a11yScore < 70) {
    issues.push(withIssueMeta({
      id: 'a11y-score-low',
      category: 'performance',
      severity: 'medium',
      title: 'Accessibility score is low',
      description: `Accessibility score: ${lh.a11yScore}/100`,
      plainEnglish: `Your site scores ${lh.a11yScore}/100 for accessibility. This usually means avoidable barriers for users and weaker baseline markup quality.`,
      cursorPrompt: 'Fix the failing Lighthouse accessibility audits and improve semantic structure, labels, and contrast.',
      value: lh.a11yScore,
    }, 'lighthouse', [evidence('metric', 'Accessibility score', lh.a11yScore)]))
  }

  return issues
}

export function buildScanResult(params: {
  url: string
  phase: ScanPhase
  timings?: ScanTimings
  stages?: ScanStage[]
  budget?: ScanBudget
  providerData?: ScanProviderData
  performance: CategoryScore
  seo: CategoryScore
  security: CategoryScore
  mobile: CategoryScore
  ai_visibility: CategoryScore
  aiSummary?: string
  topPriorities?: string[]
  aiTechnicalPrompt?: string
  issuePrompts?: Record<string, { technical: string }>
  wowInsights?: ScanResult['wowInsights']
  strategicRecommendations?: ScanResult['strategicRecommendations']
  processingIssue?: ScanProcessingIssue
  businessContext?: BusinessContext | null
  scanGoal?: ScanGoal
}): ScanResult {
  const base = {
    url: params.url,
    scannedAt: new Date().toISOString(),
    phase: params.phase,
    timings: params.timings,
    stages: params.stages,
    budget: params.budget,
    providerData: params.providerData,
    performance: params.performance,
    seo: params.seo,
    security: params.security,
    mobile: params.mobile,
    ai_visibility: params.ai_visibility,
    aiSummary: params.aiSummary,
    topPriorities: params.topPriorities,
    aiTechnicalPrompt: params.aiTechnicalPrompt,
    issuePrompts: params.issuePrompts,
    wowInsights: params.wowInsights,
    strategicRecommendations: params.strategicRecommendations,
    processingIssue: params.processingIssue,
    businessContext: params.businessContext,
    scanGoal: params.scanGoal,
  }

  const totalScore = weightedTotal(base)
  return {
    ...base,
    totalScore,
    confidenceSummary: countConfidence({
      ...base,
      totalScore,
      confidenceSummary: { verified: 0, likely: 0, heuristic: 0 },
    }),
  }
}
