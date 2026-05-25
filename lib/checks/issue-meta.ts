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
  'missing-og-url': { confidence: 'verified', scoreEligible: true },
  'og-url-mismatch': { confidence: 'verified', scoreEligible: true },
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
  'images-missing-alt': { confidence: 'heuristic', scoreEligible: false },
  'meta-robots-noindex': { confidence: 'verified', scoreEligible: true },
  'robots-txt-disallow': { confidence: 'verified', scoreEligible: true },
  'thin-internal-linking': { confidence: 'heuristic', scoreEligible: false },
  'canonical-url-mismatch': { confidence: 'likely', scoreEligible: false },
  'missing-permissions-policy': { confidence: 'verified', scoreEligible: true },
  'missing-cookie-consent': { confidence: 'heuristic', scoreEligible: false },
  'missing-privacy-policy': { confidence: 'heuristic', scoreEligible: false },
  'third-party-trackers': { confidence: 'heuristic', scoreEligible: false },
  'missing-web-manifest': { confidence: 'likely', scoreEligible: false },
  'phone-numbers-not-linked': { confidence: 'heuristic', scoreEligible: false },
  'low-a11y-score': { confidence: 'verified', scoreEligible: true },
  'images-missing-alt-a11y': { confidence: 'verified', scoreEligible: true },
  'form-inputs-no-label': { confidence: 'verified', scoreEligible: true },
  'buttons-no-label': { confidence: 'verified', scoreEligible: true },
  'missing-lang-attribute': { confidence: 'verified', scoreEligible: true },
  'missing-skip-navigation': { confidence: 'heuristic', scoreEligible: false },
  'spa-no-ssr': { confidence: 'likely', scoreEligible: true },
  'missing-analytics': { confidence: 'verified', scoreEligible: false },
  'keywords-not-in-title': { confidence: 'likely', scoreEligible: true },
  'redirect-chain': { confidence: 'verified', scoreEligible: true },
  'small-tap-targets': { confidence: 'verified', scoreEligible: true },
  'mobile-font-too-small': { confidence: 'verified', scoreEligible: true },
  // Phase 1 — DNS / Email
  'missing-spf': { confidence: 'verified', scoreEligible: true },
  'missing-dmarc': { confidence: 'verified', scoreEligible: true },
  'weak-dmarc-policy': { confidence: 'likely', scoreEligible: false },
  'missing-caa': { confidence: 'heuristic', scoreEligible: false },
  // Phase 1 — Cookie flags
  'cookie-missing-secure': { confidence: 'verified', scoreEligible: true },
  'cookie-missing-httponly': { confidence: 'verified', scoreEligible: true },
  'cookie-missing-samesite': { confidence: 'likely', scoreEligible: false },
  // Phase 1 — Exposed paths
  'exposed-git-head': { confidence: 'verified', scoreEligible: true },
  'exposed-source-map': { confidence: 'verified', scoreEligible: true },
  'graphql-introspection-open': { confidence: 'verified', scoreEligible: true },
  // Phase 1 — Per-bot AI crawlers
  'oai-searchbot-blocked': { confidence: 'verified', scoreEligible: true },
  'gptbot-blocked': { confidence: 'verified', scoreEligible: false },
  'claudebot-blocked': { confidence: 'verified', scoreEligible: true },
  'perplexitybot-blocked': { confidence: 'verified', scoreEligible: true },
  'deepseekbot-blocked': { confidence: 'heuristic', scoreEligible: false },
  // Phase 1 — llms.txt validation
  'llms-txt-no-description': { confidence: 'likely', scoreEligible: false },
  'llms-txt-no-sections': { confidence: 'heuristic', scoreEligible: false },
  'llms-txt-broken-links': { confidence: 'likely', scoreEligible: false },
  // Phase 2 — Sitemap quality
  'sitemap-empty': { confidence: 'verified', scoreEligible: true },
  'sitemap-lastmod-stale': { confidence: 'heuristic', scoreEligible: false },
  'robots-no-sitemap-directive': { confidence: 'verified', scoreEligible: true },
  'robots-disallow-all': { confidence: 'verified', scoreEligible: true },
  // Phase 2 — Semantic HTML / Schema
  'no-semantic-html': { confidence: 'likely', scoreEligible: false },
  'content-js-only': { confidence: 'likely', scoreEligible: true },
  'schema-missing-required-fields': { confidence: 'likely', scoreEligible: true },
  // Phase 3 — SSL Labs TLS
  'tls-old-protocol': { confidence: 'verified', scoreEligible: true },
  'tls-weak-cipher': { confidence: 'verified', scoreEligible: true },
  'tls-grade-low': { confidence: 'verified', scoreEligible: false },
  // Phase 3 — OSV CVE
  'vulnerable-js-lib': { confidence: 'verified', scoreEligible: true },
  // Phase 3 — CrUX field metrics
  'crux-lcp-poor': { confidence: 'verified', scoreEligible: true },
  'crux-cls-poor': { confidence: 'verified', scoreEligible: true },
  'crux-inp-poor': { confidence: 'verified', scoreEligible: true },
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
