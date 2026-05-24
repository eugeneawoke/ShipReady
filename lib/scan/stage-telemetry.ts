import type { ScanGoal, ScanStage, ScanStageId, ScanStageStatus } from '@/types/scan'

const STAGE_LABELS: Record<ScanGoal, Record<ScanStageId, string>> = {
  seo: {
    fast: 'Checking if Google can read your pages',
    crawl: 'Crawling site structure',
    lighthouse: 'Measuring Core Web Vitals',
    enrichment: 'Writing your SEO fix guide',
  },
  security: {
    fast: 'Checking HTTPS and scanning for exposed files',
    crawl: 'Crawling site for security signals',
    lighthouse: 'Running deep security checks',
    enrichment: 'Generating fix configs',
  },
  ai_visibility: {
    fast: 'Checking if ChatGPT and Claude can access your site',
    crawl: 'Crawling site for AI signals',
    lighthouse: 'Analyzing structured data and content',
    enrichment: 'Building your AI readiness report',
  },
  full: {
    fast: 'Fast truth checks',
    crawl: 'Site crawl',
    lighthouse: 'Lighthouse mobile audit',
    enrichment: 'AI enrichment',
  },
}

const DEFAULT_STAGE_MESSAGES: Partial<Record<ScanStageId, string>> = {
  crawl: 'Bounded crawl is not enabled for this scan yet.',
}

export function buildScanStages(scanGoal?: ScanGoal): ScanStage[] {
  const labels = STAGE_LABELS[scanGoal ?? 'full']
  return (Object.keys(labels) as ScanStageId[]).map((id) => ({
    id,
    label: labels[id],
    status: 'queued',
    ...(DEFAULT_STAGE_MESSAGES[id] ? { message: DEFAULT_STAGE_MESSAGES[id] } : {}),
  }))
}

export function buildDefaultScanStages(): ScanStage[] {
  return buildScanStages('full')
}

export function updateScanStage(
  stages: ScanStage[],
  stageId: ScanStageId,
  patch: Partial<Omit<ScanStage, 'id'>>,
): ScanStage[] {
  return stages.map((stage) => {
    if (stage.id !== stageId) return stage
    return {
      ...stage,
      ...patch,
    }
  })
}

export function resolveStageOutcomeStatus(outcomes: boolean[]): ScanStageStatus {
  const successCount = outcomes.filter(Boolean).length
  if (successCount === outcomes.length) return 'done'
  if (successCount === 0) return 'failed'
  return 'partial'
}

export function failRunningStages(stages: ScanStage[], message: string): ScanStage[] {
  return stages.map((stage) => (
    stage.status === 'running'
      ? {
          ...stage,
          status: 'failed',
          message,
        }
      : stage
  ))
}
