import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl } from '@/lib/utils'

// This endpoint is deployed on Railway only.
// Vercel calls it to offload heavy Lighthouse scans.
export const maxDuration = 300

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.SCANNER_SECRET || auth !== `Bearer ${process.env.SCANNER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let url: string, scanId: string
  try {
    const body = await request.json()
    url = body.url
    scanId = body.scanId
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
  runAllChecks(url, scanId).catch((e: unknown) => {
    console.error('run-scan background error:', e)
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
