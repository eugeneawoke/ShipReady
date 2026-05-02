import type { Issue, StrategicRecommendation } from '@/types/scan'

const STRATEGIC_TIMEFRAME_LABELS: Record<StrategicRecommendation['timeframe'], string> = {
  now: 'Now',
  next_2_weeks: 'Next 2 weeks',
  next_month: 'Next month',
}

function safeText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback
}

export function issueSeverityLabel(issue: Partial<Issue>) {
  return safeText(issue.severity, 'unknown').toUpperCase()
}

export function issueConfidenceLabel(issue: Partial<Issue>) {
  return safeText(issue.confidence, 'unknown')
}

export function issueTitle(issue: Partial<Issue>) {
  return safeText(issue.title, safeText(issue.id, 'Untitled issue'))
}

export function issueBody(issue: Partial<Issue>) {
  return safeText(issue.plainEnglish, safeText(issue.description, 'No issue details were provided.'))
}

export function issueEvidenceLine(issue: Partial<Issue>, limit = 2) {
  const evidence = Array.isArray(issue.evidence) ? issue.evidence.slice(0, limit) : []
  const readableEvidence = evidence
    .map(item => {
      const label = safeText(item?.label, 'Evidence')
      const value = item?.value ?? 'unknown'
      return `${label}: ${String(value)}`
    })
    .filter(Boolean)

  return readableEvidence.length ? ` Evidence: ${readableEvidence.join('; ')}.` : ''
}

export function normalizeStrategicRecommendationsForDisplay(value: unknown): StrategicRecommendation[] {
  if (!Array.isArray(value)) return []

  return value.flatMap(item => {
    if (!item || typeof item !== 'object') return []
    const recommendation = item as Partial<StrategicRecommendation>
    const timeframe = recommendation.timeframe

    if (!timeframe || !(timeframe in STRATEGIC_TIMEFRAME_LABELS)) return []

    const title = safeText(recommendation.title, '')
    const body = safeText(recommendation.body, '')
    if (!title || !body) return []

    return [{
      timeframe,
      title,
      body,
      evidenceRefs: Array.isArray(recommendation.evidenceRefs) ? recommendation.evidenceRefs : undefined,
    }]
  }).slice(0, 3)
}

export function strategicTimeframeLabel(timeframe: StrategicRecommendation['timeframe']) {
  return STRATEGIC_TIMEFRAME_LABELS[timeframe]
}
