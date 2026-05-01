import type {
  Issue,
  IssueConfidence,
  IssueEvidence,
  IssueSource,
  MeasurementState,
} from '@/types/scan'

const CONFIDENCE_MAP: Record<string, { confidence: IssueConfidence; scoreEligible: boolean }> = {
  'lcp-slow': { confidence: 'verified', scoreEligible: true },
  'cls-high': { confidence: 'verified', scoreEligible: true },
  'inp-slow': { confidence: 'verified', scoreEligible: true },
  'fcp-slow': { confidence: 'verified', scoreEligible: true },
  'perf-score-low': { confidence: 'verified', scoreEligible: true },
  'a11y-score-low': { confidence: 'verified', scoreEligible: true },
  'missing-title': { confidence: 'verified', scoreEligible: true },
  'title-length': { confidence: 'heuristic', scoreEligible: false },
  'missing-description': { confidence: 'verified', scoreEligible: true },
  'missing-h1': { confidence: 'verified', scoreEligible: true },
  'missing-canonical': { confidence: 'verified', scoreEligible: true },
  'missing-og-title': { confidence: 'verified', scoreEligible: true },
  'missing-og-description': { confidence: 'verified', scoreEligible: true },
  'missing-og-image': { confidence: 'verified', scoreEligible: true },
  'og-image-invalid': { confidence: 'likely', scoreEligible: false },
  'missing-twitter-card': { confidence: 'verified', scoreEligible: true },
  'missing-twitter-image': { confidence: 'verified', scoreEligible: true },
  'missing-og-url': { confidence: 'verified', scoreEligible: true },
  'og-url-mismatch': { confidence: 'verified', scoreEligible: true },
  'og-url-double-slash': { confidence: 'verified', scoreEligible: true },
  'canonical-mismatch': { confidence: 'verified', scoreEligible: true },
  'canonical-double-slash': { confidence: 'verified', scoreEligible: true },
  'sensitive-page-indexable': { confidence: 'verified', scoreEligible: true },
  'page-noindex': { confidence: 'verified', scoreEligible: true },
  'image-missing-alt': { confidence: 'verified', scoreEligible: true },
  'image-missing-dimensions': { confidence: 'verified', scoreEligible: true },
  'placeholder-text': { confidence: 'heuristic', scoreEligible: false },
  'broken-links': { confidence: 'likely', scoreEligible: false },
  'no-https': { confidence: 'verified', scoreEligible: true },
  'missing-hsts': { confidence: 'verified', scoreEligible: true },
  'missing-x-frame': { confidence: 'verified', scoreEligible: true },
  'missing-xcto': { confidence: 'verified', scoreEligible: true },
  'missing-referrer-policy': { confidence: 'verified', scoreEligible: true },
  'missing-csp': { confidence: 'verified', scoreEligible: true },
  'unsafe-csp': { confidence: 'verified', scoreEligible: true },
  'ssl-expiring': { confidence: 'verified', scoreEligible: true },
  'exposed-env-file': { confidence: 'verified', scoreEligible: true },
  'api-key-in-html': { confidence: 'likely', scoreEligible: false },
  'mixed-content': { confidence: 'likely', scoreEligible: false },
  'missing-viewport': { confidence: 'verified', scoreEligible: true },
  'blocking-viewport': { confidence: 'verified', scoreEligible: true },
  'missing-favicon': { confidence: 'verified', scoreEligible: true },
  'missing-touch-icon': { confidence: 'verified', scoreEligible: true },
  'missing-schema-org': { confidence: 'verified', scoreEligible: true },
  'missing-structured-data': { confidence: 'likely', scoreEligible: false },
  'missing-operating-system': { confidence: 'likely', scoreEligible: false },
  'missing-faq-schema': { confidence: 'likely', scoreEligible: false },
  'poor-heading-hierarchy': { confidence: 'likely', scoreEligible: false },
  'thin-content': { confidence: 'heuristic', scoreEligible: false },
  'missing-llms-txt': { confidence: 'verified', scoreEligible: true },
  'ai-crawlers-blocked': { confidence: 'verified', scoreEligible: true },
  'missing-sitemap': { confidence: 'verified', scoreEligible: true },
  'missing-author-entity': { confidence: 'heuristic', scoreEligible: false },
}

export function evidence(kind: IssueEvidence['kind'], label: string, value: string | number): IssueEvidence {
  return { kind, label, value }
}

export function withIssueMeta(issue: Issue, source: IssueSource, details: IssueEvidence[] = []): Issue {
  const meta = CONFIDENCE_MAP[issue.id] ?? { confidence: 'heuristic' as const, scoreEligible: false }
  return {
    ...issue,
    confidence: issue.confidence ?? meta.confidence,
    scoreEligible: issue.scoreEligible ?? meta.scoreEligible,
    evidence: issue.evidence ?? details,
    source: issue.source ?? source,
  }
}

export function measurement(label: string, status: MeasurementState['status'], message?: string, durationMs?: number): MeasurementState {
  return { label, status, message, durationMs }
}
