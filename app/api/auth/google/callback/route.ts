// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyState } from '@/lib/integrations/oauth-state'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/dashboard?error=google_denied', request.url))
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL('/dashboard?error=google_invalid', request.url))
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('oauth_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(new URL('/dashboard?error=google_state_mismatch', request.url))
  }
  const stateData = verifyState(state)
  if (!stateData) {
    return NextResponse.redirect(new URL('/dashboard?error=google_state_expired', request.url))
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }).toString(),
  })
  if (!tokenRes.ok) {
    return NextResponse.redirect(new URL('/dashboard?error=google_token_exchange', request.url))
  }
  const tokens = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in?: number
    scope?: string
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  const supabase = createServiceClient()
  await supabase
    .from('oauth_integrations')
    .upsert(
      {
        user_id: stateData.userId,
        provider: 'google',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        scope: tokens.scope ?? null,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    )

  // Clear state cookie
  cookieStore.delete('oauth_state')

  return NextResponse.redirect(new URL('/dashboard?connected=google', request.url))
}
