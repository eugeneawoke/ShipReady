import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'
import type { ScanGoal } from '@/types/scan'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let apiKeyCtx
  try {
    apiKeyCtx = await validateApiKey(request.headers.get('authorization'))
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  let body: { url?: string; goal?: ScanGoal }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawUrl = body?.url
  if (!rawUrl || typeof rawUrl !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 422 })
  }

  let safeUrl: string
  try {
    safeUrl = await assertSafeScanUrl(rawUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'URL validation failed'
    if (msg.toLowerCase().includes('unsafe') || msg.toLowerCase().includes('private') || msg.toLowerCase().includes('blocked')) {
      return NextResponse.json({ error: msg }, { status: 403 })
    }
    return NextResponse.json({ error: msg }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data: scan, error } = await supabase
    .from('scans')
    .insert({
      url: safeUrl,
      status: 'pending',
      user_id: apiKeyCtx.userId,
      goal: body.goal ?? null,
    })
    .select('id, url, status')
    .single()

  if (error || !scan) {
    console.error('[api/v1/scan] Failed to create scan:', error)
    return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
  }

  // Dispatch to Railway scanner
  const scannerUrl = process.env.RAILWAY_SCANNER_URL
  if (scannerUrl) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''
    fetch(`${scannerUrl}/api/run-scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SCANNER_SECRET}`,
      },
      body: JSON.stringify({ scanId: scan.id, url: safeUrl, callbackUrl: `${appUrl}/api/run-scan` }),
    }).catch(err => console.error('[api/v1/scan] Scanner dispatch failed:', err))
  }

  return NextResponse.json({ id: scan.id, status: scan.status, url: scan.url }, { status: 201 })
}
