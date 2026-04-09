export type ScanStatus =
  | 'pending'
  | 'running'
  | 'running_fast'
  | 'running_deep'
  | 'enriching'
  | 'done'
  | 'error'

export type ScanPhase = 'fast' | 'deep' | 'enriching' | 'final'
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'pass'
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility'
export type IssueConfidence = 'verified' | 'likely' | 'heuristic'
export type IssueSource = 'lighthouse' | 'http' | 'dom' | 'ssl' | 'link-check' | 'ai-visibility' | 'ai-enrichment'
export type EvidenceKind = 'metric' | 'header' | 'selector' | 'response' | 'text' | 'count' | 'status'
export type MeasurementStatus = 'measured' | 'partial' | 'unavailable'

export interface IssueEvidence {
  kind: EvidenceKind
  label: string
  value: string | number
}

export interface Issue {
  id: string
  category: IssueCategory
  severity: IssueSeverity
  title: string
  description: string
  plainEnglish: string
  cursorPrompt: string
  boltPrompt: string
  docsUrl?: string
  value?: string | number
  confidence?: IssueConfidence
  scoreEligible?: boolean
  evidence?: IssueEvidence[]
  source?: IssueSource
}

export interface MeasurementState {
  status: MeasurementStatus
  label: string
  message?: string
  durationMs?: number
}

export interface CategoryScore {
  score: number | null
  label: 'excellent' | 'good' | 'needs-work' | 'poor' | 'unavailable'
  issues: Issue[]
  passedChecks: number
  totalChecks: number
  measurement?: MeasurementState
}

export interface ScanTimings {
  htmlFetchMs?: number
  fastPassMs?: number
  lighthouseMs?: number
  deepPassMs?: number
  aiEnrichmentMs?: number
  totalMs?: number
}

export interface WowInsight {
  title: string
  body: string
  evidenceRefs?: string[]
}

export interface ScanProcessingIssue {
  kind: 'timeout'
  stage: ScanStatus
  message: string
  recommendation: string
  staleAgeSeconds: number
}

export interface ScanResult {
  url: string
  scannedAt: string
  phase: ScanPhase
  totalScore: number | null
  confidenceSummary: {
    verified: number
    likely: number
    heuristic: number
  }
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
  wowInsights?: WowInsight[]
  processingIssue?: ScanProcessingIssue
}

export interface Scan {
  id: string
  url: string
  status: ScanStatus
  results: ScanResult | null
  user_id: string | null
  created_at: string
  updated_at: string
  processingIssue?: ScanProcessingIssue
}
