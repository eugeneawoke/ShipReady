export type ScanStatus =
  | 'pending'
  | 'running'
  | 'running_fast'
  | 'running_deep'
  | 'enriching'
  | 'crawling'
  | 'done'
  | 'error'

export type ScanPhase = 'fast' | 'deep' | 'enriching' | 'final'
export type ScanPlan = 'free' | 'pro' | 'agency'
export type ScanStageId = 'fast' | 'crawl' | 'lighthouse' | 'enrichment'
export type ScanStageStatus = 'queued' | 'running' | 'partial' | 'failed' | 'done'
export type ScanProviderId = 'aiEnrichment' | 'wowInsights' | 'pagespeed'
export type ScanProviderStatus = 'ready' | 'done' | 'failed' | 'skipped' | 'unavailable' | 'blocked'
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'pass'
export type IssueCategory = 'performance' | 'seo' | 'security' | 'mobile' | 'ai_visibility' | 'accessibility'
export type IssueConfidence = 'verified' | 'likely' | 'heuristic'
export type IssueSource = 'lighthouse' | 'http' | 'dom' | 'ssl' | 'link-check' | 'ai-visibility' | 'ai-enrichment' | 'accessibility'
export type EvidenceKind = 'metric' | 'header' | 'selector' | 'response' | 'text' | 'count' | 'status'
export type MeasurementStatus = 'measured' | 'partial' | 'unavailable'

export type ScanGoal = 'seo' | 'security' | 'ai_visibility' | 'full'

export interface BusinessContext {
  businessType: 'ecommerce' | 'saas' | 'local_business' | 'portfolio' | 'blog' | 'agency' | 'other'
  techStack: string[]
  mainCTA: string | null
  monetizationModel?: 'subscription' | 'lead_generation' | 'ecommerce' | 'content' | 'unknown'
  productType?: 'saas_tool' | 'service_business' | 'content_site' | 'online_store' | 'portfolio' | 'unknown'
  primaryConversionPath?: 'free_scan' | 'signup' | 'demo' | 'contact' | 'checkout' | 'newsletter' | 'unknown'
  icpHint?: 'agency' | 'developer' | 'local_business' | 'ecommerce_team' | 'founder' | 'consumer' | 'unknown'
  detectedService: string | null
  targetAudience: string | null
  businessProfile: string | null
}

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
  fixPrompt: string
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

export interface ScanStage {
  id: ScanStageId
  label: string
  status: ScanStageStatus
  message?: string
  durationMs?: number
}

export interface ScanProviderBudget {
  maxCalls: number
  callsUsed: number
  status: ScanProviderStatus
  message?: string
}

export interface ScanBudget {
  plan: ScanPlan
  crawl: {
    enabled: boolean
    maxDepth: number
    maxPages: number
  }
  providers: Record<ScanProviderId, ScanProviderBudget>
}

export interface PageSpeedProviderData {
  source: 'google-pagespeed-insights'
  fetchedAt: string
  strategy: 'mobile'
  analysisUrl: string
  origin?: string
  performanceScore: number | null
  fieldMetrics: {
    lcpMs?: number
    inpMs?: number
    cls?: number
  }
}

export interface ScanProviderData {
  pagespeed?: PageSpeedProviderData
}

export interface SiteIssueAggregate {
  issueId: string
  title: string
  category: IssueCategory
  occurrenceCount: number
  urls: string[]
}

export interface SiteSummary {
  pagesCrawled: number
  recurringIssues: SiteIssueAggregate[]
}

export interface WowInsight {
  title: string
  body: string
  evidenceRefs?: string[]
}

export interface StrategicRecommendation {
  timeframe: 'now' | 'next_2_weeks' | 'next_month'
  title: string
  body: string
  evidenceRefs?: string[]
}

export interface ScanProcessingIssue {
  kind: 'timeout' | 'stage_failure'
  stage: ScanStatus
  message: string
  recommendation: string
  staleAgeSeconds: number
}

export interface GeneratedArtifacts {
  llmsTxt?: string
  schemaOrgJson?: string
  securityHeadersNextJs?: string
  securityHeadersNginx?: string
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
  stages?: ScanStage[]
  budget?: ScanBudget
  providerData?: ScanProviderData
  siteSummary?: SiteSummary
  performance: CategoryScore
  seo: CategoryScore
  security: CategoryScore
  mobile: CategoryScore
  ai_visibility: CategoryScore
  accessibility: CategoryScore
  aiSummary?: string
  topPriorities?: string[]
  aiTechnicalPrompt?: string
  issuePrompts?: Record<string, { technical: string }>
  wowInsights?: WowInsight[]
  strategicRecommendations?: StrategicRecommendation[]
  businessContext?: BusinessContext | null
  scanGoal?: ScanGoal
  processingIssue?: ScanProcessingIssue
  generatedArtifacts?: GeneratedArtifacts
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
