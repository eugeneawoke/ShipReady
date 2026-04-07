import { NextRequest, NextResponse } from 'next/server'
import { isValidUrl, normalizeUrl } from '@/lib/utils'
import { createClient, createServiceClient } from '@/lib/supabase'
import { FREE_SCAN_LIMIT } from '@/lib/auth'

export const maxDuration = 10

// Anonymous users: max scans per IP per hour
const ANON_HOURLY_LIMIT = 5

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  // CSRF: only accept requests originating from our own app
  const origin = request.headers.get('origin')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (origin && appUrl) {
    const allowed = [appUrl, 'http://localhost:3000', 'http://localhost:3001']
    if (!allowed.some(o => origin.startsWith(o))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  try {
    const body = await request.json()
    const raw = body.url as string

    if (!raw || !isValidUrl(normalizeUrl(raw))) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const url = normalizeUrl(raw)
    const supabase = createServiceClient()

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
      // Auth check is best-effort — unauthenticated scans proceed to IP rate limit
    }

    // IP-based rate limit for anonymous users
    if (!userId) {
      const ip = getClientIp(request)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { count } = await supabase
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .is('user_id', null)
        .gte('created_at', oneHourAgo)

      if ((count ?? 0) >= ANON_HOURLY_LIMIT) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Sign in for more scans.', upgradeUrl: '/pricing' },
          { status: 429 }
        )
      }
    }

    const ip = !userId ? getClientIp(request) : null

    const { data, error } = await supabase
      .from('scans')
      .insert({
        url,
        status: 'pending',
        ...(userId ? { user_id: userId } : {}),
        ...(ip ? { ip_address: ip } : {}),
      })
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
      }).catch(() => {
        // Railway call failed — scan will stay in 'pending' state
      })
    } else {
      // Fallback: run locally (dev / no Railway configured)
      setTimeout(async () => {
        try {
          const { runAllChecks } = await import('@/lib/checks/index')
          await runAllChecks(url, data.id)
        } catch {
          // runAllChecks marks the scan as 'error' internally
        }
      }, 0)
    }

    return NextResponse.json({ id: data.id }, { status: 202 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
