import { NextRequest, NextResponse } from 'next/server'

// This endpoint is deployed on Railway only.
// Vercel calls it to offload heavy Lighthouse scans.
export const maxDuration = 300

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

  try {
    const { runAllChecks } = await import('@/lib/checks/index')
    await runAllChecks(url, scanId)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('run-scan failed:', e)
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 })
  }
}
