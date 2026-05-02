import type { Issue, IssueCategory, ScanResult } from '@/types/scan'
import { getPassedChecksForCategory } from '@/lib/report/check-catalog'
import {
  issueBody,
  issueConfidenceLabel,
  issueEvidenceLine,
  issueSeverityLabel,
  issueTitle,
} from '@/lib/report/report-safety'

const ISSUE_CATEGORY_ORDER: IssueCategory[] = ['performance', 'seo', 'security', 'mobile', 'ai_visibility']

const ISSUE_CATEGORY_LABELS: Record<IssueCategory, string> = {
  performance: 'Performance',
  seo: 'SEO',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI visibility',
}

export function formatIssueCategoryLabel(category: IssueCategory): string {
  return ISSUE_CATEGORY_LABELS[category]
}

export function buildMeasurementNotes(results: ScanResult): string[] {
  return ISSUE_CATEGORY_ORDER.flatMap(category => {
    const measurement = results[category].measurement
    if (!measurement || measurement.status === 'measured') return []
    return `${ISSUE_CATEGORY_LABELS[category]}: ${measurement.label} is ${measurement.status}${measurement.message ? ` (${measurement.message})` : ''}.`
  })
}

export function buildFixEverythingPrompt(results: ScanResult, activeIssues: Issue[]): string {
  const grouped = groupIssuesByCategory(activeIssues)
  const issueBlock = grouped.length
    ? grouped.map(group => {
        const lines = group.issues.map((issue, index) => (
          `${index + 1}. [${issueSeverityLabel(issue)} · ${issueConfidenceLabel(issue)}] ${issueTitle(issue)}. ${issueBody(issue)}${issueEvidenceLine(issue)}`
        ))
        return `${ISSUE_CATEGORY_LABELS[group.category]}:\n${lines.join('\n')}`
      }).join('\n\n')
    : 'No verified score-bearing issues were found in the completed checks.'

  const measurementNotes = buildMeasurementNotes(results)
  const measurementBlock = measurementNotes.length
    ? `\n\nUnavailable or partial measurements:\n${measurementNotes.map((note, index) => `${index + 1}. ${note}`).join('\n')}`
    : ''

  const providerBlock = results.providerData?.pagespeed
    ? `\n\nExternal performance context:\n- Google PageSpeed Insights (${results.providerData.pagespeed.strategy}) fetched at ${results.providerData.pagespeed.fetchedAt}\n- Source: ${results.providerData.pagespeed.analysisUrl}\n- Reported performance score: ${results.providerData.pagespeed.performanceScore ?? 'unavailable'}`
    : ''

  const recurringBlock = results.siteSummary?.recurringIssues?.length
    ? `\n\nRecurring issues across crawled pages:\n${results.siteSummary.recurringIssues.map((issue, index) => `${index + 1}. ${issue.title} appears on ${issue.occurrenceCount} pages: ${issue.urls.slice(0, 5).join(', ')}`).join('\n')}`
    : ''

  return `You are a senior engineer performing a complete remediation pass on a scanned production website. Fix all verified and visible issues described below in one coherent implementation plan. Write instructions that are clear enough for any coding AI or engineering assistant to execute without additional context.${providerBlock}${recurringBlock}

Issues to fix:
${issueBlock}${measurementBlock}

Execution rules:
- Cover every listed problem in this single response. Do not skip lower-severity issues unless a higher-priority fix fully resolves them.
- Use the existing stack and architecture. Do not propose a rewrite or unrelated refactor.
- For each issue, say exactly what to change, where to change it, and how to verify the fix on the live site.
- Keep confidence honest: verified issues are hard failures; likely or heuristic issues must be described as needing confirmation if they appear.
- Treat unavailable measurements as unknown, never as healthy.
- End with a single verification checklist that confirms the full scan should pass after the fixes are applied.`
}

export function groupIssuesByCategory(issues: Issue[]): Array<{ category: IssueCategory; issues: Issue[] }> {
  return ISSUE_CATEGORY_ORDER
    .map((category) => ({
      category,
      issues: issues.filter(issue => issue.category === category),
    }))
    .filter(group => group.issues.length > 0)
}

export function buildPassedCheckGroups(results: ScanResult) {
  return ISSUE_CATEGORY_ORDER
    .map((category) => ({
      category,
      checks: getPassedChecksForCategory(category, results),
    }))
    .filter(group => group.checks.length > 0)
}
