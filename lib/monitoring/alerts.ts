import type { Issue, ScanResult } from '@/types/scan'
import { getAllIssues } from '@/lib/scoring'

export interface MonitoringAlertDecision {
  shouldAlert: boolean
  scoreDrop: number
  previousScore: number | null
  currentScore: number | null
  newSeriousIssues: Issue[]
}

function seriousIssues(result: ScanResult): Issue[] {
  return getAllIssues(result).filter((issue) => issue.severity === 'critical' || issue.severity === 'high')
}

function issueKey(issue: Issue): string {
  return `${issue.category}:${issue.id}:${issue.severity}`
}

export function buildMonitoringAlertDecision(
  previous: ScanResult | null,
  current: ScanResult,
): MonitoringAlertDecision {
  if (!previous) {
    return {
      shouldAlert: false,
      scoreDrop: 0,
      previousScore: null,
      currentScore: current.totalScore,
      newSeriousIssues: [],
    }
  }

  const previousSet = new Set(seriousIssues(previous).map(issueKey))
  const newSeriousIssues = seriousIssues(current).filter((issue) => !previousSet.has(issueKey(issue)))
  const previousScore = previous.totalScore
  const currentScore = current.totalScore
  const scoreDrop = previousScore !== null && currentScore !== null ? previousScore - currentScore : 0
  const shouldAlert = scoreDrop > 10 || newSeriousIssues.length > 0

  return {
    shouldAlert,
    scoreDrop,
    previousScore,
    currentScore,
    newSeriousIssues,
  }
}
