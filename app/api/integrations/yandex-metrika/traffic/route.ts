// app/api/integrations/yandex-metrika/traffic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getValidToken } from '@/lib/integrations/token-refresh'
import { fetchYandexMetrikaTraffic } from '@/lib/integrations/yandex-metrika'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const counterId = request.nextUrl.searchParams.get('counterId')
  if (!counterId) {
    return NextResponse.json(
      {
        error: 'counterId required',
        hint: 'Find it in Яндекс Метрика → Настройки счётчика → Номер счётчика',
      },
      { status: 422 }
    )
  }

  const token = await getValidToken(user.id, 'yandex')
  if (!token) return NextResponse.json({ error: 'Yandex not connected' }, { status: 404 })

  const result = await fetchYandexMetrikaTraffic(token, counterId)
  if (!result) return NextResponse.json({ error: 'Yandex Metrika API error' }, { status: 502 })

  return NextResponse.json(result)
}
