import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'

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

  if (apiKeyCtx.plan !== 'agency') {
    return NextResponse.json({ error: 'Bulk scan requires Agency plan' }, { status: 403 })
  }

  let body: { urls?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const urls = body?.urls
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'urls must be a non-empty array' }, { status: 422 })
  }

  if (urls.length > 10) {
    return NextResponse.json({ error: 'urls array cannot exceed 10 items' }, { status: 422 })
  }

  if (!urls.every((url) => typeof url === 'string')) {
    return NextResponse.json({ error: 'All urls must be strings' }, { status: 422 })
  }

  const results: Array<{ id: string; status: string; url: string }> = []
  const failed: Array<{ url: string; error: string }> = []

  const supabase = createServiceClient()
  const scannerUrl = process.env.RAILWAY_SCANNER_URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || ''

  for (const rawUrl of urls) {
    let safeUrl: string
    try {
      safeUrl = await assertSafeScanUrl(rawUrl)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'URL validation failed'
      failed.push({ url: rawUrl, error: msg })
      continue
    }

    const { data: scan, error } = await supabase
      .from('scans')
      .insert({
        url: safeUrl,
        status: 'pending',
        user_id: apiKeyCtx.userId,
      })
      .select('id, url, status')
      .single()

    if (error || !scan) {
      console.error('[api/v1/bulk-scan] Failed to create scan for URL:', safeUrl, error)
      failed.push({ url: rawUrl, error: 'Failed to create scan' })
      continue
    }

    results.push({ id: scan.id, status: scan.status, url: scan.url })

    if (scannerUrl) {
      fetch(`${scannerUrl}/api/run-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SCANNER_SECRET}`,
        },
        body: JSON.stringify({ scanId: scan.id, url: safeUrl, callbackUrl: `${appUrl}/api/run-scan` }),
      }).catch((err) => console.error('[api/v1/bulk-scan] Scanner dispatch failed for scan', scan.id, ':', err))
    }
  }

  const statusCode = failed.length > 0 ? 207 : 201
  return NextResponse.json({ scans: results, failed }, { status: statusCode })
}
