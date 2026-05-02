import type { ScanStage, ScanStageId, ScanStageStatus } from '@/types/scan'

const DEFAULT_STAGE_LABELS: Record<ScanStageId, string> = {
  fast: 'Fast truth checks',
  crawl: 'Site crawl',
  lighthouse: 'Lighthouse mobile audit',
  enrichment: 'AI enrichment',
}

const DEFAULT_STAGE_MESSAGES: Partial<Record<ScanStageId, string>> = {
  crawl: 'Bounded crawl is not enabled for this scan yet.',
}

export function buildDefaultScanStages(): ScanStage[] {
  return (Object.keys(DEFAULT_STAGE_LABELS) as ScanStageId[]).map((id) => ({
    id,
    label: DEFAULT_STAGE_LABELS[id],
    status: 'queued',
    ...(DEFAULT_STAGE_MESSAGES[id] ? { message: DEFAULT_STAGE_MESSAGES[id] } : {}),
  }))
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
