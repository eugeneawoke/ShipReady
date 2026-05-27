// app/api/integrations/bing/indexing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchBingIndexing } from '@/lib/integrations/bing-webmaster'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain parameter required' }, { status: 422 })

  const token = await getValidToken(user.id, 'bing')
  if (!token) return NextResponse.json({ error: 'Bing not connected' }, { status: 404 })

  const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`
  const result = await fetchBingIndexing(token, siteUrl)
  if (!result) return NextResponse.json({ error: 'Bing Webmaster API error' }, { status: 502 })

  return NextResponse.json(result)
}
