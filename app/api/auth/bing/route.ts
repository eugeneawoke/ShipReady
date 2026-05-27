// app/api/auth/bing/route.ts
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
  cookieStore.set('oauth_state_bing', state, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
  })

  const tenant = process.env.BING_OAUTH_TENANT_ID || 'common'
  const params = new URLSearchParams({
    client_id: process.env.BING_OAUTH_CLIENT_ID!,
    response_type: 'code',
    redirect_uri: process.env.BING_OAUTH_REDIRECT_URI!,
    scope: 'https://ssl.bing.com/webmaster/api offline_access',
    state,
  })

  return NextResponse.redirect(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?${params.toString()}`
  )
}
