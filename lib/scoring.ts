import type {
  CategoryScore,
  Issue,
  IssueSeverity,
  MeasurementState,
  ScanPhase,
  ScanResult,
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
  seo: 10,         // title, description, h1, canonical, og:title, og:description, og:image, twitter:card, placeholder, broken-links
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

function scoreLabel(score: number | null): CategoryScore['label'] {
  if (score === null) return 'unavailable'
  if (score >= 90) return 'excellent'
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
  const scorableIssues = issues.filter(issue => issue.scoreEligible)
  const deduction = scorableIssues.reduce((sum, issue) => sum + DEDUCTIONS[issue.severity], 0)
  const score = measurementState.status === 'unavailable' ? null : Math.max(0, 100 - deduction)
  const totalChecks = TOTAL_CHECKS[category]

  return {
    score,
    label: scoreLabel(score),
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
      boltPrompt: 'Prioritize the hero content and reduce render-blocking resources so the main content appears under 2.5 seconds.',
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
      boltPrompt: 'Set explicit dimensions and reserve space for dynamic elements to stop layout jumps.',
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
      boltPrompt: 'Reduce the JavaScript work that runs during clicks and typing so the page responds faster.',
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
      boltPrompt: 'Make above-the-fold assets load first and delay non-critical resources so the page paints sooner.',
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
      boltPrompt: 'Focus on the biggest Lighthouse opportunities first until the mobile score clears 70.',
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
      boltPrompt: 'Improve accessibility basics like labels, contrast, alt text, and semantic headings until the score is above 70.',
      value: lh.a11yScore,
    }, 'lighthouse', [evidence('metric', 'Accessibility score', lh.a11yScore)]))
  }

  return issues
}

export function buildScanResult(params: {
  url: string
  phase: ScanPhase
  timings?: ScanTimings
  performance: CategoryScore
  seo: CategoryScore
  security: CategoryScore
  mobile: CategoryScore
  ai_visibility: CategoryScore
  aiSummary?: string
  topPriorities?: string[]
  aiTechnicalPrompt?: string
  aiVibePrompt?: string
  issuePrompts?: Record<string, { technical: string; vibe: string }>
  wowInsights?: ScanResult['wowInsights']
}): ScanResult {
  const base = {
    url: params.url,
    scannedAt: new Date().toISOString(),
    phase: params.phase,
    timings: params.timings,
    performance: params.performance,
    seo: params.seo,
    security: params.security,
    mobile: params.mobile,
    ai_visibility: params.ai_visibility,
    aiSummary: params.aiSummary,
    topPriorities: params.topPriorities,
    aiTechnicalPrompt: params.aiTechnicalPrompt,
    aiVibePrompt: params.aiVibePrompt,
    issuePrompts: params.issuePrompts,
    wowInsights: params.wowInsights,
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
