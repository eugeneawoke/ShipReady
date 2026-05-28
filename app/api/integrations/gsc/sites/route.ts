// app/api/integrations/gsc/sites/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchGscSites } from '@/lib/integrations/gsc'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = await getValidToken(user.id, 'google')
  if (!token) return NextResponse.json({ error: 'Google not connected' }, { status: 404 })

  const sites = await fetchGscSites(token)
  return NextResponse.json({ sites })
}
