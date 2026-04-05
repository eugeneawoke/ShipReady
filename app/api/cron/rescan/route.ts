import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  // Verify this is a Vercel Cron request
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

  // Queue new scans
  let count = 0
  for (const scan of toRescan) {
    const { data } = await supabase
      .from('scans')
      .insert({ url: scan.url, user_id: scan.user_id, status: 'pending' })
      .select('id')
      .single()

    if (data) {
      // Fire and forget
      setTimeout(async () => {
        try {
          const { runAllChecks } = await import('@/lib/checks/index')
          await runAllChecks(scan.url, data.id)
        } catch {}
      }, 0)
      count++
    }
  }

  return NextResponse.json({ rescanned: count })
}
