// app/api/integrations/yandex-webmaster/indexing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchYandexUserId, fetchYandexHosts, fetchYandexIndexing } from '@/lib/integrations/yandex-webmaster'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const domain = request.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ error: 'domain parameter required' }, { status: 422 })

  const token = await getValidToken(user.id, 'yandex')
  if (!token) return NextResponse.json({ error: 'Yandex not connected' }, { status: 404 })

  const yandexUserId = await fetchYandexUserId(token)
  if (!yandexUserId) return NextResponse.json({ error: 'Failed to get Yandex user ID' }, { status: 502 })

  const hosts = await fetchYandexHosts(token, yandexUserId)
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '')
  const host = hosts.find((h) => h.unicode_host_url.includes(normalizedDomain))
  if (!host) return NextResponse.json({ error: 'Domain not verified in Yandex Webmaster' }, { status: 404 })

  const result = await fetchYandexIndexing(token, yandexUserId, host.host_id)
  if (!result) return NextResponse.json({ error: 'Yandex Webmaster API error' }, { status: 502 })

  return NextResponse.json(result)
}
