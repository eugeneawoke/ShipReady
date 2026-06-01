import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyBearerToken } from '@/lib/server/verify-bearer'

export const runtime = 'nodejs'

function adminAuth(req: NextRequest): boolean {
  return verifyBearerToken(req.headers.get('authorization'), process.env.ADMIN_SECRET)
}

// GET /api/admin/audits/scan-search?domain=linear.app
export async function GET(req: NextRequest) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = req.nextUrl.searchParams.get('domain')?.trim()
  if (!domain) return NextResponse.json({ scans: [] })

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('scans')
    .select('id, url, created_at, result')
    .ilike('url', `%${domain}%`)
    .eq('status', 'done')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const scans = (data ?? []).map(s => ({
    id: s.id,
    url: s.url,
    created_at: s.created_at,
    score: (s.result as Record<string, unknown> | null)?.totalScore ?? null,
  }))

  return NextResponse.json({ scans })
}
