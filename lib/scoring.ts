import type { Issue, CategoryScore, ScanResult, IssueSeverity } from '@/types/scan'

const DEDUCTIONS: Record<IssueSeverity, number> = {
  critical: 25,
  high: 15,
  medium: 7,
  low: 3,
  pass: 0,
}

const TOTAL_CHECKS = {
  performance: 6,
  seo: 11,
  security: 11,
  mobile: 4,
  ai_visibility: 8,
}

function scoreLabel(score: number): CategoryScore['label'] {
  if (score >= 90) return 'excellent'
  if (score >= 70) return 'good'
  if (score >= 50) return 'needs-work'
  return 'poor'
}

export function buildCategoryScore(
  issues: Issue[],
  category: keyof typeof TOTAL_CHECKS,
): CategoryScore {
  const deduction = issues.reduce((sum, i) => sum + DEDUCTIONS[i.severity], 0)
  const score = Math.max(0, 100 - deduction)
  const totalChecks = TOTAL_CHECKS[category]
  return {
    score,
    label: scoreLabel(score),
    issues,
    passedChecks: totalChecks - issues.length,
    totalChecks,
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

export function buildScanResult(
  url: string,
  lh: {
    performanceScore: number
    seoScore: number
    a11yScore: number
    lcp: number
    cls: number
    inp: number
    fcp: number
  },
  seoIssues: Issue[],
  secIssues: Issue[],
  mobIssues: Issue[],
  linkIssues: Issue[],
  aiVisibilityIssues: Issue[],
): ScanResult {
  const perfIssues: Issue[] = []

  if (lh.lcp > 2500) {
    perfIssues.push({
      id: 'lcp-slow',
      category: 'performance',
      severity: 'high',
      title: 'LCP is slow',
      description: `LCP is ${(lh.lcp / 1000).toFixed(1)}s`,
      plainEnglish: `Your page takes ${(lh.lcp / 1000).toFixed(1)}s to show the main content. Google's target is under 2.5s.`,
      cursorPrompt:
        'Optimize Largest Contentful Paint: lazy load images below fold, add priority to hero image, use next/image with sizes prop',
      boltPrompt:
        'Add loading="eager" and fetchpriority="high" to your hero image. Move render-blocking scripts to bottom of body.',
      value: `${(lh.lcp / 1000).toFixed(1)}s`,
    })
  }

  if (lh.cls > 0.1) {
    perfIssues.push({
      id: 'cls-high',
      category: 'performance',
      severity: 'high',
      title: 'Layout shift detected',
      description: `CLS score is ${lh.cls.toFixed(3)}`,
      plainEnglish:
        'Your page elements jump around while loading. This frustrates users and hurts SEO rankings.',
      cursorPrompt:
        'Fix Cumulative Layout Shift: add explicit width/height to all images and iframes, reserve space for dynamic content with min-height, avoid inserting content above existing content',
      boltPrompt:
        'Add width and height attributes to all your images. Add a fixed height to any containers that load content dynamically.',
      value: lh.cls.toFixed(3),
    })
  }

  if (lh.inp > 200) {
    perfIssues.push({
      id: 'inp-slow',
      category: 'performance',
      severity: 'medium',
      title: 'Slow interaction response',
      description: `INP is ${lh.inp}ms`,
      plainEnglish: `Your page takes ${lh.inp}ms to respond to clicks. Target is under 200ms.`,
      cursorPrompt:
        'Optimize Interaction to Next Paint: defer non-critical JS, break long tasks with scheduler.yield(), use React.memo for expensive components',
      boltPrompt:
        'Move your JavaScript to the bottom of the page and add defer attribute to script tags.',
      value: `${lh.inp}ms`,
    })
  }

  if (lh.fcp > 1800) {
    perfIssues.push({
      id: 'fcp-slow',
      category: 'performance',
      severity: 'medium',
      title: 'First paint is slow',
      description: `FCP is ${(lh.fcp / 1000).toFixed(1)}s`,
      plainEnglish: `Your page takes ${(lh.fcp / 1000).toFixed(1)}s to show anything. Users see a blank screen.`,
      cursorPrompt:
        'Improve First Contentful Paint: inline critical CSS, preload key fonts, remove render-blocking resources',
      boltPrompt:
        'Add <link rel="preload"> tags for your main font and CSS files in the HTML head.',
      value: `${(lh.fcp / 1000).toFixed(1)}s`,
    })
  }

  if (lh.performanceScore > 0 && lh.performanceScore < 70) {
    perfIssues.push({
      id: 'perf-score-low',
      category: 'performance',
      severity: 'high',
      title: 'Low performance score',
      description: `Performance score: ${lh.performanceScore}/100`,
      plainEnglish: `Google rates your page ${lh.performanceScore}/100 for performance. This directly affects your search ranking.`,
      cursorPrompt:
        'Run: npx lighthouse URL --output html --view to see detailed performance recommendations',
      boltPrompt:
        'Your overall performance score is low. Focus on reducing page size and eliminating render-blocking resources.',
      value: lh.performanceScore,
    })
  }

  if (lh.a11yScore > 0 && lh.a11yScore < 70) {
    perfIssues.push({
      id: 'a11y-score-low',
      category: 'performance',
      severity: 'medium',
      title: 'Accessibility issues',
      description: `Accessibility score: ${lh.a11yScore}/100`,
      plainEnglish: `Your site scores ${lh.a11yScore}/100 for accessibility. Many users with disabilities may not be able to use it.`,
      cursorPrompt:
        'Fix accessibility: add aria-label to icon buttons, ensure color contrast ratio >= 4.5:1, add alt text to all images, use semantic HTML (nav, main, h1-h6 hierarchy)',
      boltPrompt:
        'Add alt="" text to all images. Make sure buttons have descriptive text. Check color contrast with WebAIM Contrast Checker.',
      value: lh.a11yScore,
    })
  }

  const allSeoIssues = [...seoIssues, ...linkIssues]

  const performance = buildCategoryScore(perfIssues, 'performance')
  const seo = buildCategoryScore(allSeoIssues, 'seo')
  const security = buildCategoryScore(secIssues, 'security')
  const mobile = buildCategoryScore(mobIssues, 'mobile')
  const ai_visibility = buildCategoryScore(aiVisibilityIssues, 'ai_visibility')

  const totalScore = Math.round(
    performance.score * 0.25 +
      seo.score * 0.20 +
      security.score * 0.25 +
      mobile.score * 0.10 +
      ai_visibility.score * 0.20,
  )

  return {
    url,
    scannedAt: new Date().toISOString(),
    totalScore,
    performance,
    seo,
    security,
    mobile,
    ai_visibility,
  }
}
