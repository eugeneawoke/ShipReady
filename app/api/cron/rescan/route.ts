import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { dispatchScanToRailway } from '@/lib/server/scanner-dispatch'
import { getEffectivePlanForUserId } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel Cron request
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: monitoredDomains } = await supabase
    .from('monitored_domains')
    .select('id, user_id, domain, last_scan_id')
    .eq('active', true)

  if (!monitoredDomains?.length) return NextResponse.json({ rescanned: 0 })

  if (!process.env.RAILWAY_SCANNER_URL || !process.env.SCANNER_SECRET) {
    return NextResponse.json({ error: 'Scanner is not configured' }, { status: 500 })
  }

  const domainIds = monitoredDomains.map((domain: { id: string }) => domain.id)
  const { data: runningScans } = await supabase
    .from('scans')
    .select('monitored_domain_id')
    .in('monitored_domain_id', domainIds)
    .in('status', ['pending', 'running_fast', 'running_deep', 'enriching'])

  const runningDomainIds = new Set(
    (runningScans ?? [])
      .map((scan: { monitored_domain_id: string | null }) => scan.monitored_domain_id)
      .filter((value: string | null): value is string => Boolean(value)),
  )

  // Queue new scans
  let count = 0
  let skippedFree = 0
  for (const monitoredDomain of monitoredDomains as Array<{ id: string; user_id: string; domain: string; last_scan_id: string | null }>) {
    if (runningDomainIds.has(monitoredDomain.id)) continue

    const { effectivePlan } = await getEffectivePlanForUserId(monitoredDomain.user_id)
    if (effectivePlan === 'free') {
      skippedFree++
      continue
    }

    const { data } = await supabase
      .from('scans')
      .insert({
        url: `https://${monitoredDomain.domain}`,
        user_id: monitoredDomain.user_id,
        status: 'pending',
        monitored_domain_id: monitoredDomain.id,
        baseline_scan_id: monitoredDomain.last_scan_id,
        trigger: 'cron',
      })
      .select('id')
      .single()

    if (data) {
      try {
        await dispatchScanToRailway(data.id, `https://${monitoredDomain.domain}`)
        count++
      } catch (error) {
        console.error('[cron] Failed to dispatch rescan:', error)
        await supabase.from('scans').update({ status: 'error' }).eq('id', data.id)
      }
    }
  }

  return NextResponse.json({ rescanned: count, skippedFree })
}
