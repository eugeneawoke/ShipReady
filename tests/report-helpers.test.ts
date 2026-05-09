import test from 'node:test'
import assert from 'node:assert/strict'

import type { Issue, IssueCategory, ScanResult } from '../types/scan'
import {
  buildFixEverythingPrompt,
  buildPassedCheckGroups,
  groupIssuesByCategory,
} from '../lib/report/report-helpers'

function createIssue(overrides: Partial<Issue> = {}): Issue {
  return {
    id: 'missing-title',
    category: 'seo',
    severity: 'high',
    title: 'Missing title',
    description: 'No title tag detected.',
    plainEnglish: 'Your page has no title tag.',
    fixPrompt: 'Add a title tag.',
    confidence: 'verified',
    scoreEligible: true,
    evidence: [{ kind: 'selector', label: 'title', value: 'missing' }],
    source: 'dom',
    ...overrides,
  }
}

function categoryScore(category: IssueCategory, issues: Issue[] = []) {
  return {
    score: issues.length ? 85 : 100,
    label: issues.length ? 'needs-work' as const : 'excellent' as const,
    issues,
    passedChecks: 2,
    totalChecks: 2,
    measurement: { label: `${category} audit`, status: 'measured' as const },
  }
}

function createResult(): ScanResult {
  const seoIssue = createIssue()
  const securityIssue = createIssue({
    id: 'missing-csp',
    category: 'security',
    severity: 'critical',
    title: 'Missing CSP',
    description: 'No Content-Security-Policy header detected.',
    plainEnglish: 'Your site does not send a CSP header.',
    evidence: [{ kind: 'header', label: 'content-security-policy', value: 'missing' }],
  })

  return {
    url: 'https://example.com',
    scannedAt: new Date().toISOString(),
    phase: 'final',
    totalScore: 78,
    confidenceSummary: { verified: 2, likely: 0, heuristic: 0 },
    performance: categoryScore('performance'),
    seo: categoryScore('seo', [seoIssue]),
    security: categoryScore('security', [securityIssue]),
    mobile: categoryScore('mobile'),
    ai_visibility: categoryScore('ai_visibility'),
    providerData: {
      pagespeed: {
        source: 'google-pagespeed-insights',
        fetchedAt: '2026-05-02T08:00:00.000Z',
        strategy: 'mobile',
        analysisUrl: 'https://pagespeed.web.dev/example',
        performanceScore: 82,
        fieldMetrics: { lcpMs: 2300, inpMs: 180, cls: 0.05 },
      },
    },
    siteSummary: {
      pagesCrawled: 3,
      recurringIssues: [
        {
          issueId: 'missing-title',
          title: 'Missing title',
          category: 'seo',
          occurrenceCount: 3,
          urls: ['https://example.com/', 'https://example.com/about'],
        },
      ],
    },
  }
}

test('buildFixEverythingPrompt is universal and includes all issue context', () => {
  const result = createResult()
  const issues = [...result.seo.issues, ...result.security.issues]

  const prompt = buildFixEverythingPrompt(result, issues)

  assert.match(prompt, /all verified and visible issues/i)
  assert.match(prompt, /Security/i)
  assert.match(prompt, /SEO/i)
  assert.match(prompt, /Google PageSpeed Insights/i)
  assert.match(prompt, /Recurring issues across crawled pages/i)
  assert.doesNotMatch(prompt, /Cursor|Claude Code|Windsurf/i)
})

test('groupIssuesByCategory keeps report order and groups issue lists', () => {
  const grouped = groupIssuesByCategory([
    createIssue({ category: 'security', id: 'missing-csp', title: 'Missing CSP' }),
    createIssue({ category: 'seo', id: 'missing-title', title: 'Missing title' }),
    createIssue({ category: 'security', id: 'missing-hsts', title: 'Missing HSTS' }),
  ])

  assert.deepEqual(grouped.map(group => group.category), ['seo', 'security'])
  assert.deepEqual(grouped[1]?.issues.map(issue => issue.id), ['missing-csp', 'missing-hsts'])
})

test('buildPassedCheckGroups returns collapsed-ready detailed passed checks by category', () => {
  const result = createResult()

  const groups = buildPassedCheckGroups(result)
  const seoGroup = groups.find(group => group.category === 'seo')

  assert.ok(seoGroup)
  assert.ok(seoGroup!.checks.length > 0)
  assert.equal(seoGroup!.checks.some(check => check.id === 'missing-title'), false)
  assert.equal(seoGroup!.checks.some(check => check.id === 'missing-description'), true)
})
