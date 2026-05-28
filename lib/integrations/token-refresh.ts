import { createServiceClient } from '@/lib/supabase'

type Provider = 'google' | 'yandex' | 'bing'

function refreshUrl(provider: Provider): string {
  if (provider === 'google') return 'https://oauth2.googleapis.com/token'
  if (provider === 'yandex') return 'https://oauth.yandex.ru/token'
  if (provider === 'bing') {
    const tenant = process.env.BING_OAUTH_TENANT_ID || 'common'
    return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
  }
  throw new Error(`Unknown provider: ${provider}`)
}

function credentials(provider: Provider): { client_id: string; client_secret: string } {
  if (provider === 'google') {
    return {
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
    }
  }
  if (provider === 'yandex') {
    return {
      client_id: process.env.YANDEX_OAUTH_CLIENT_ID!,
      client_secret: process.env.YANDEX_OAUTH_CLIENT_SECRET!,
    }
  }
  // bing
  return {
    client_id: process.env.BING_OAUTH_CLIENT_ID!,
    client_secret: process.env.BING_OAUTH_CLIENT_SECRET!,
  }
}

/** Returns a valid access token for the given user+provider, refreshing if needed. Returns null if not connected or refresh fails. */
export async function getValidToken(userId: string, provider: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('oauth_integrations')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', provider)
    .maybeSingle()

  if (!data) return null

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0
  const needsRefresh = expiresAt < Date.now() + 5 * 60 * 1000 // refresh 5 min before expiry

  if (!needsRefresh) return data.access_token
  if (!data.refresh_token) return data.access_token // no refresh token, use as-is

  try {
    const { client_id, client_secret } = credentials(provider as Provider)
    const res = await fetch(refreshUrl(provider as Provider), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: data.refresh_token,
        client_id,
        client_secret,
      }).toString(),
    })
    if (!res.ok) return data.access_token // fall back to existing if refresh fails
    const tokens = await res.json() as { access_token: string; expires_in?: number }
    const newExpiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null
    await supabase
      .from('oauth_integrations')
      .update({
        access_token: tokens.access_token,
        expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', provider)
    return tokens.access_token
  } catch {
    return data.access_token // best-effort: return existing token on error
  }
}

/** Returns the user_id for a given scan, or null if the scan is anonymous. Used by scanner enrichment. */
export async function getScanUserId(scanId: string): Promise<string | null> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('scans')
    .select('user_id')
    .eq('id', scanId)
    .maybeSingle()
  return data?.user_id ?? null
}

/** Returns all connected providers for a given user. */
export async function getConnectedProviders(userId: string): Promise<string[]> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('oauth_integrations')
    .select('provider')
    .eq('user_id', userId)
  return (data ?? []).map((r) => r.provider)
}
