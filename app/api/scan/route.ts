import { NextRequest, NextResponse } from 'next/server'
import { waitUntil } from '@vercel/functions'
import { isValidUrl, normalizeUrl } from '@/lib/utils'
import { createClient, createServiceClient } from '@/lib/supabase'
import { FREE_SCAN_LIMIT } from '@/lib/auth'
import { assertSafeScanUrl } from '@/lib/server/url-safety'
import { dispatchScanToRailway } from '@/lib/server/scanner-dispatch'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'

export const maxDuration = 60

// Anonymous users: same monthly limit as free tier, tracked by IP
const ANON_MONTHLY_LIMIT = 3

function startOfCurrentMonth(): string {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)
  return start.toISOString()
}

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

export async function POST(request: NextRequest) {
  const guardResponse = requireSameOriginJsonRequest(request)
  if (guardResponse) return guardResponse

  try {
    const body = await request.json()
    const raw = body.url as string

    if (!raw || !isValidUrl(normalizeUrl(raw))) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const url = normalizeUrl(raw)
    await assertSafeScanUrl(url)
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
          const { count } = await userSupabase
            .from('scans')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .gte('created_at', startOfCurrentMonth())

          if ((count ?? 0) >= FREE_SCAN_LIMIT) {
            return NextResponse.json(
              { error: 'Free limit reached', upgradeUrl: '/#pricing' },
              { status: 429 }
            )
          }
        }
      }
    } catch {
      // Auth check is best-effort — unauthenticated scans proceed to IP rate limit
    }

    // IP-based rate limit for anonymous users — same as free tier (3/month)
    if (!userId) {
      const ip = getClientIp(request)
      const { count } = await supabase
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('ip_address', ip)
        .is('user_id', null)
        .gte('created_at', startOfCurrentMonth())

      if ((count ?? 0) >= ANON_MONTHLY_LIMIT) {
        return NextResponse.json(
          { error: 'Free limit reached. Sign in to continue.', upgradeUrl: '/#pricing' },
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

    if (process.env.RAILWAY_SCANNER_URL && process.env.SCANNER_SECRET) {
      // Delegate to Railway scanner — use waitUntil so Vercel keeps the function
      // alive until Railway acknowledges (Railway responds 202 immediately)
      waitUntil(
        dispatchScanToRailway(data.id, url).catch(async (err) => {
          console.error(`[scan] Railway fetch failed: ${err}`)
          await supabase.from('scans').update({ status: 'error' }).eq('id', data.id)
        })
      )
    } else if (process.env.NODE_ENV === 'development') {
      // Fallback: run locally in dev only
      setTimeout(async () => {
        try {
          const { runAllChecks } = await import('@/lib/checks/index')
          await runAllChecks(url, data.id)
        } catch {
          // runAllChecks marks the scan as 'error' internally
        }
      }, 0)
    } else {
      // Production without Railway — fail immediately with clear error
      await supabase.from('scans').update({ status: 'error' }).eq('id', data.id)
    }

    return NextResponse.json({ id: data.id }, { status: 202 })
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
