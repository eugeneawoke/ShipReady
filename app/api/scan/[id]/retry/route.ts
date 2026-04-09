import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { createClient, createServiceClient } from '@/lib/supabase'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'
import { dispatchLighthouseRetryToRailway } from '@/lib/server/scanner-dispatch'
import {
  finishLighthouseRetryUnavailable,
  markLighthouseRetryRunning,
  retryLighthouseForScan,
} from '@/lib/checks/retry-lighthouse'

const ACTIVE_SCAN_STATUSES = ['pending', 'running', 'running_fast', 'running_deep', 'enriching']

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guardResponse = requireSameOriginJsonRequest(request)
  if (guardResponse) return guardResponse

  const { id } = await params

  let measurement: string
  try {
    const body = await request.json()
    measurement = body.measurement
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (measurement !== 'lighthouse') {
    return NextResponse.json({ error: 'Unsupported measurement' }, { status: 400 })
  }

  const userSupabase = await createClient()
  const { data: { user } } = await userSupabase.auth.getUser()
  const supabase = createServiceClient()

  const { data: scan, error } = await supabase
    .from('scans')
    .select('id, url, user_id, status, results, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (scan.user_id && scan.user_id !== user?.id) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (ACTIVE_SCAN_STATUSES.includes(scan.status)) {
    return NextResponse.json({ error: 'Scan is still running' }, { status: 409 })
  }

  if (!scan.results) {
    return NextResponse.json({ error: 'Report has no completed checks to retry from' }, { status: 409 })
  }

  try {
    const results = await markLighthouseRetryRunning(id)

    if (process.env.RAILWAY_SCANNER_URL && process.env.SCANNER_SECRET) {
      waitUntil(
        dispatchLighthouseRetryToRailway(id).catch(async (err) => {
          console.error(`[scan] Railway Lighthouse retry failed: ${err}`)
          await finishLighthouseRetryUnavailable(id, 'Lighthouse retry could not start on the scanner runner')
        })
      )
    } else if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        retryLighthouseForScan(id).catch((err: unknown) => {
          console.error('[scan] Local Lighthouse retry failed:', err)
        })
      }, 0)
    } else {
      await finishLighthouseRetryUnavailable(id, 'Lighthouse retry could not start because the scanner runner is not configured')
    }

    return NextResponse.json({
      scan: {
        ...scan,
        status: 'running_deep',
        results,
        updated_at: new Date().toISOString(),
      },
    }, { status: 202 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not retry Lighthouse'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
