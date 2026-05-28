// app/api/integrations/gsc/indexing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchGscIndexing } from '@/lib/integrations/gsc'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain parameter required' }, { status: 422 })

  const token = await getValidToken(user.id, 'google')
  if (!token) return NextResponse.json({ error: 'Google not connected' }, { status: 404 })

  // Try both https:// and sc-domain: prefixes
  const siteUrl = domain.startsWith('http') ? domain : `https://${domain}`
  const result = await fetchGscIndexing(token, siteUrl, siteUrl)
  if (!result) return NextResponse.json({ error: 'GSC API error or site not verified' }, { status: 502 })

  return NextResponse.json(result)
}
