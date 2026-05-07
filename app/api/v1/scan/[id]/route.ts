import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'
import type { ScanResult } from '@/types/scan'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let apiKeyCtx
  try {
    apiKeyCtx = await validateApiKey(request.headers.get('authorization'))
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()

  const { data: scan } = await supabase
    .from('scans')
    .select('id, url, status, results, user_id')
    .eq('id', id)
    .single()

  if (!scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  if (scan.user_id !== apiKeyCtx.userId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  return NextResponse.json({
    id: scan.id,
    url: scan.url,
    status: scan.status,
    results: scan.results as ScanResult | null,
  })
}
