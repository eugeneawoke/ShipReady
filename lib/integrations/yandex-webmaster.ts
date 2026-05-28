// lib/integrations/yandex-webmaster.ts

export interface YandexWebmasterIndexing {
  indexed: number
  errors: number
  warnings: number
}

// Yandex Webmaster requires knowing the user's Yandex user ID first
export async function fetchYandexUserId(accessToken: string): Promise<string | null> {
  const res = await fetch('https://api.webmaster.yandex.net/v4/user', {
    headers: { Authorization: `OAuth ${accessToken}` },
  })
  if (!res.ok) return null
  const data = await res.json() as { user_id?: number }
  return data.user_id?.toString() ?? null
}

export async function fetchYandexHosts(
  accessToken: string,
  yandexUserId: string
): Promise<Array<{ host_id: string; unicode_host_url: string }>> {
  const res = await fetch(
    `https://api.webmaster.yandex.net/v4/user/${yandexUserId}/hosts`,
    { headers: { Authorization: `OAuth ${accessToken}` } }
  )
  if (!res.ok) return []
  const data = await res.json() as { hosts?: Array<{ host_id: string; unicode_host_url: string }> }
  return data.hosts ?? []
}

export async function fetchYandexIndexing(
  accessToken: string,
  yandexUserId: string,
  hostId: string
): Promise<YandexWebmasterIndexing | null> {
  const res = await fetch(
    `https://api.webmaster.yandex.net/v4/user/${yandexUserId}/hosts/${hostId}/summary`,
    { headers: { Authorization: `OAuth ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json() as {
    indexed_count?: number
    errors_count?: number
    warnings_count?: number
  }
  return {
    indexed: data.indexed_count ?? 0,
    errors: data.errors_count ?? 0,
    warnings: data.warnings_count ?? 0,
  }
}
