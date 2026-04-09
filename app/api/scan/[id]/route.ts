import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase'
import type { ScanProcessingIssue, ScanResult, ScanStatus } from '@/types/scan'

const ACTIVE_SCAN_STATUSES = ['pending', 'running', 'running_fast', 'running_deep', 'enriching']
const DEFAULT_STALE_SCAN_MS = 3 * 60 * 1000
const STALE_SCAN_MS_BY_STATUS: Record<string, number> = {
  pending: 3 * 60 * 1000,
  running: 3 * 60 * 1000,
  running_fast: 3 * 60 * 1000,
  running_deep: 8 * 60 * 1000,
  enriching: 4 * 60 * 1000,
}

const STAGE_LABELS: Record<string, string> = {
  pending: 'queueing the scan',
  running: 'running the scan',
  running_fast: 'running fast truth checks',
  running_deep: 'running deep analysis',
  enriching: 'writing the AI-assisted report',
}

function isStaleActiveScan(status: string, updatedAt: string | null): boolean {
  if (!ACTIVE_SCAN_STATUSES.includes(status) || !updatedAt) return false
  const staleAfterMs = STALE_SCAN_MS_BY_STATUS[status] ?? DEFAULT_STALE_SCAN_MS
  return Date.now() - new Date(updatedAt).getTime() > staleAfterMs
}

function buildProcessingIssue(status: string, staleAgeSeconds: number): ScanProcessingIssue {
  const stageLabel = STAGE_LABELS[status] ?? 'processing the scan'
  return {
    kind: 'timeout',
    stage: status as ScanStatus,
    staleAgeSeconds,
    message: `The scanner stopped while ${stageLabel}.`,
    recommendation: 'Run the scan again. If it fails again, send us this report URL so we can inspect the scanner logs.',
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('scans')
    .select('id, url, status, results, user_id, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (data.user_id && data.user_id !== user?.id) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  let status = data.status
  let updatedAt = data.updated_at
  let results = data.results as ScanResult | null
  let processingIssue = results?.processingIssue

  if (isStaleActiveScan(status, updatedAt)) {
    const staleAgeSeconds = Math.round((Date.now() - new Date(updatedAt).getTime()) / 1000)
    console.error(`[scan] Marking stale scan as error: id=${id} status=${status} staleAgeSeconds=${staleAgeSeconds}`)

    processingIssue = buildProcessingIssue(status, staleAgeSeconds)
    if (results) {
      results = {
        ...results,
        processingIssue,
      }
    }

    const nextUpdatedAt = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        status: 'error',
        updated_at: nextUpdatedAt,
        ...(results ? { results } : {}),
      })
      .eq('id', id)
      .in('status', ACTIVE_SCAN_STATUSES)

    if (!updateError) {
      status = 'error'
      updatedAt = nextUpdatedAt
    } else {
      console.error('[scan] Failed to mark stale scan as error:', updateError)
    }
  }

  return NextResponse.json({
    id: data.id,
    url: data.url,
    status,
    results,
    created_at: data.created_at,
    updated_at: updatedAt,
    processingIssue,
  })
}
