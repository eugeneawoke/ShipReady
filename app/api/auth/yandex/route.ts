// app/api/auth/yandex/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { createState } from '@/lib/integrations/oauth-state'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  const state = createState(user.id, '/dashboard')
  const cookieStore = await cookies()
  cookieStore.set('oauth_state_yandex', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  const params = new URLSearchParams({
    client_id: process.env.YANDEX_OAUTH_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.YANDEX_OAUTH_REDIRECT_URI!,
    // Yandex does not support space-separated scopes in query; scope is configured in OAuth app settings
    state,
  })

  return NextResponse.redirect(
    `https://oauth.yandex.ru/authorize?${params.toString()}`
  )
}
