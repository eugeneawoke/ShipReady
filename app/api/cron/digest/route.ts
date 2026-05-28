import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { sendWeeklyDigest } from '@/lib/email/send-digest'
import type { ScanResult } from '@/types/scan'

export const runtime = 'nodejs'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')

  // Fetch active monitored domains where digest is overdue
  const { data: domains } = await supabase
    .from('monitored_domains')
    .select('id, user_id, domain, notify_email, last_scan_id, last_digest_sent_at, digest_baseline_scan_id')
    .eq('active', true)

  if (!domains?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const md of domains as Array<{
    id: string
    user_id: string
    domain: string
    notify_email: string | null
    last_scan_id: string | null
    last_digest_sent_at: string | null
    digest_baseline_scan_id: string | null
  }>) {
    if (!md.notify_email || !md.last_scan_id) { skipped++; continue }

    // Skip if digest sent less than 7 days ago
    if (md.last_digest_sent_at) {
      const lastSent = new Date(md.last_digest_sent_at).getTime()
      if (Date.now() - lastSent < SEVEN_DAYS_MS) { skipped++; continue }
    }

    // Fetch latest scan
    const { data: latestScan } = await supabase
      .from('scans')
      .select('id, results')
      .eq('id', md.last_scan_id)
      .single()

    if (!latestScan?.results) { skipped++; continue }

    // Fetch baseline scan (previous digest baseline or latest scan from 7+ days ago)
    let baselineScanId = md.digest_baseline_scan_id
    if (!baselineScanId) {
      const cutoff = new Date(Date.now() - SEVEN_DAYS_MS).toISOString()
      const { data: oldScan } = await supabase
        .from('scans')
        .select('id')
        .eq('user_id', md.user_id)
        .ilike('url', `%${md.domain}%`)
        .eq('status', 'done')
        .lt('created_at', cutoff)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      baselineScanId = oldScan?.id ?? null
    }

    if (!baselineScanId) { skipped++; continue }

    const { data: baselineScan } = await supabase
      .from('scans')
      .select('results')
      .eq('id', baselineScanId)
      .single()

    if (!baselineScan?.results) { skipped++; continue }

    try {
      await sendWeeklyDigest({
        email: md.notify_email,
        domain: md.domain,
        reportUrl: `${appUrl}/report/${latestScan.id}`,
        latestScan: latestScan.results as ScanResult,
        baselineScan: baselineScan.results as ScanResult,
      })

      await supabase
        .from('monitored_domains')
        .update({
          last_digest_sent_at: new Date().toISOString(),
          digest_baseline_scan_id: latestScan.id,
        })
        .eq('id', md.id)

      sent++
    } catch (err) {
      console.error('[cron/digest] Failed to send digest:', err)
    }
  }

  return NextResponse.json({ sent, skipped })
}
