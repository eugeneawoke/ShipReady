import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, normalizeUrl } from '@/lib/utils'
import { createClient, createServiceClient } from '@/lib/supabase'
import { FREE_SCAN_LIMIT } from '@/lib/auth'

export const maxDuration = 10

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const raw = body.url as string

    if (!raw || !isValidUrl(normalizeUrl(raw))) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const url = normalizeUrl(raw)

    // Check auth and rate-limit free tier
    let userId: string | null = null
    try {
      const userSupabase = await createClient()
      const { data: { user } } = await userSupabase.auth.getUser()
      if (user) {
        userId = user.id

        const { data: profile } = await userSupabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()

        const plan = profile?.plan ?? 'free'

        if (plan === 'free') {
          const startOfMonth = new Date()
          startOfMonth.setDate(1)
          startOfMonth.setHours(0, 0, 0, 0)

          const { count } = await userSupabase
            .from('scans')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfMonth.toISOString())

          if ((count ?? 0) >= FREE_SCAN_LIMIT) {
            return NextResponse.json(
              { error: 'Free limit reached', upgradeUrl: '/pricing' },
              { status: 429 }
            )
          }
        }
      }
    } catch {
      // Auth check is best-effort — unauthenticated scans proceed normally
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('scans')
      .insert({ url, status: 'pending', ...(userId ? { user_id: userId } : {}) })
      .select('id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Failed to create scan' }, { status: 500 })
    }

    const railwayUrl = process.env.RAILWAY_SCANNER_URL
    const scannerSecret = process.env.SCANNER_SECRET

    if (railwayUrl && scannerSecret) {
      // Delegate to Railway scanner — fire and forget
      fetch(`${railwayUrl}/api/run-scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${scannerSecret}`,
        },
        body: JSON.stringify({ url, scanId: data.id }),
      }).catch(e => console.error('Railway scanner call failed:', e))
    } else {
      // Fallback: run locally (dev / no Railway configured)
      setTimeout(async () => {
        try {
          const { runAllChecks } = await import('@/lib/checks/index')
          await runAllChecks(url, data.id)
        } catch (e) {
          console.error('Scan failed:', e)
        }
      }, 0)
    }

    return NextResponse.json({ id: data.id }, { status: 202 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
