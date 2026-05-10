import { NextRequest, NextResponse } from 'next/server'
import { getUserWithPlan } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase'
import { normalizeDomain, domainFromUrl } from '@/lib/monitoring/domains'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'

async function latestScanIdForDomain(userId: string, domain: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data: scans } = await supabase
    .from('scans')
    .select('id, url')
    .eq('user_id', userId)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(100)

  const latest = scans?.find((scan: { id: string; url: string }) => domainFromUrl(scan.url) === domain)
  return latest?.id ?? null
}

export async function POST(request: NextRequest) {
  const guardResponse = requireSameOriginJsonRequest(request)
  if (guardResponse) return guardResponse

  const user = await getUserWithPlan()
  if (!user || (user.effectivePlan !== 'pro' && user.effectivePlan !== 'agency')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const domain = normalizeDomain(body.domain as string)
    const lastScanId = await latestScanIdForDomain(user.id, domain)
    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('monitored_domains')
      .upsert({
        user_id: user.id,
        domain,
        notify_email: user.email,
        active: true,
        last_scan_id: lastScanId,
      }, { onConflict: 'user_id,domain' })
      .select('id, domain, notify_email, active, last_scan_id, last_alerted_at, created_at, updated_at')
      .single()

    if (error || !data) {
      console.error('[monitor] enable failed:', error)
      return NextResponse.json({ error: error?.message || 'Failed to enable monitoring' }, { status: 500 })
    }

    return NextResponse.json({ monitoredDomain: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest) {
  const guardResponse = requireSameOriginJsonRequest(request)
  if (guardResponse) return guardResponse

  const user = await getUserWithPlan()
  if (!user || (user.effectivePlan !== 'pro' && user.effectivePlan !== 'agency')) {
    return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const domain = normalizeDomain(body.domain as string)
    const supabase = createServiceClient()

    const { error } = await supabase
      .from('monitored_domains')
      .update({ active: false })
      .eq('user_id', user.id)
      .eq('domain', domain)

    if (error) {
      console.error('[monitor] disable failed:', error)
      return NextResponse.json({ error: error.message || 'Failed to disable monitoring' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bad request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
