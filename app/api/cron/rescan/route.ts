import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { dispatchScanToRailway } from '@/lib/server/scanner-dispatch'

export async function GET(request: NextRequest) {
  // Verify this is a legitimate Vercel Cron request
  const authHeader = request.headers.get('authorization')
  const isVercelCron = request.headers.get('x-vercel-cron') === '1'
  if (!isVercelCron || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Find Pro/Agency users' most recent scans for rescan
  const { data: proProfiles } = await supabase
    .from('profiles')
    .select('id')
    .in('plan', ['pro', 'agency'])

  if (!proProfiles?.length) return NextResponse.json({ rescanned: 0 })

  const userIds = proProfiles.map((p: { id: string }) => p.id)

  // Get the latest completed scan per user
  const { data: scans } = await supabase
    .from('scans')
    .select('id, url, user_id')
    .in('user_id', userIds)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(userIds.length * 3) // up to 3 per user

  if (!scans?.length) return NextResponse.json({ rescanned: 0 })

  // Deduplicate to one scan per user (most recent)
  const seen = new Set<string>()
  const toRescan = scans.filter((s: { id: string; url: string; user_id: string }) => {
    if (seen.has(s.user_id)) return false
    seen.add(s.user_id)
    return true
  })

  if (!process.env.RAILWAY_SCANNER_URL || !process.env.SCANNER_SECRET) {
    return NextResponse.json({ error: 'Scanner is not configured' }, { status: 500 })
  }

  // Queue new scans
  let count = 0
  for (const scan of toRescan) {
    const { data } = await supabase
      .from('scans')
      .insert({ url: scan.url, user_id: scan.user_id, status: 'pending' })
      .select('id')
      .single()

    if (data) {
      try {
        await dispatchScanToRailway(data.id, scan.url)
        count++
      } catch (error) {
        console.error('[cron] Failed to dispatch rescan:', error)
        await supabase.from('scans').update({ status: 'error' }).eq('id', data.id)
      }
    }
  }

  return NextResponse.json({ rescanned: count })
}
