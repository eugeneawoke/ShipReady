import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, normalizeUrl } from '@/lib/utils'
import { createServiceClient } from '@/lib/supabase'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const raw = body.url as string

    if (!raw || !isValidUrl(normalizeUrl(raw))) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const url = normalizeUrl(raw)
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('scans')
      .insert({ url, status: 'pending' })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
    }

    // Fire and forget — do not await
    // Will be replaced with proper background processing
    setTimeout(async () => {
      try {
        const { runAllChecks } = await import('@/lib/checks/index')
        await runAllChecks(url, data.id)
      } catch (e) {
        console.error('Scan failed:', e)
      }
    }, 0)

    return NextResponse.json({ id: data.id }, { status: 202 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
