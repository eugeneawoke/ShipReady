import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl } from '@/lib/utils'
import type { ScanGoal } from '@/types/scan'

// This endpoint is deployed on Railway only.
// Vercel calls it to offload heavy Lighthouse scans.
export const maxDuration = 300
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const VALID_GOALS = ['seo', 'security', 'ai_visibility', 'full'] as const

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.SCANNER_SECRET || auth !== `Bearer ${process.env.SCANNER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string, scanId: string, scanGoal: ScanGoal | undefined, userLocale: string | undefined
  try {
    const body = await request.json()
    url = body.url
    scanId = body.scanId
    scanGoal = VALID_GOALS.includes(body.scanGoal) ? body.scanGoal : undefined
    userLocale = body.userLocale === 'ru' ? 'ru' : undefined
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!url || !scanId) {
    return NextResponse.json({ error: 'Missing url or scanId' }, { status: 400 })
  }

  if (!isValidUrl(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: 'Invalid scanId' }, { status: 400 })
  }

  // Respond immediately — Railway is a persistent server so the Promise
  // continues running after the response is sent (unlike Vercel serverless)
  const { runAllChecks } = await import('@/lib/checks/index')
  runAllChecks(url, scanId, scanGoal, userLocale).catch((e: unknown) => {
    console.error('run-scan background error:', e)
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
