import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!process.env.SCANNER_SECRET || auth !== `Bearer ${process.env.SCANNER_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let scanId: string
  let measurement: string
  try {
    const body = await request.json()
    scanId = body.scanId
    measurement = body.measurement
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!UUID_RE.test(scanId)) {
    return NextResponse.json({ error: 'Invalid scanId' }, { status: 400 })
  }

  if (measurement !== 'lighthouse') {
    return NextResponse.json({ error: 'Unsupported measurement' }, { status: 400 })
  }

  const { retryLighthouseForScan } = await import('@/lib/checks/retry-lighthouse')
  retryLighthouseForScan(scanId).catch((error: unknown) => {
    console.error('measurement retry background error:', error)
  })

  return NextResponse.json({ ok: true }, { status: 202 })
}
