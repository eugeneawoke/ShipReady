// lib/integrations/yandex-metrika.ts

export interface YandexMetrikaTraffic {
  visits: number
  bounceRate: number
  avgDuration: number
}

export interface YandexMetrikaCounter {
  id: number
  site: string
}

export async function fetchYandexMetrikaCounters(
  accessToken: string,
): Promise<YandexMetrikaCounter[]> {
  const res = await fetch(
    'https://api-metrika.yandex.net/management/v1/counters',
    { headers: { Authorization: `OAuth ${accessToken}` } },
  )
  if (!res.ok) return []
  const data = await res.json() as {
    counters?: Array<{ id: number; site?: string }>
  }
  return (data.counters ?? [])
    .filter(c => c.site)
    .map(c => ({ id: c.id, site: c.site! }))
}

export async function fetchYandexMetrikaTraffic(
  accessToken: string,
  counterId: string
): Promise<YandexMetrikaTraffic | null> {
  const params = new URLSearchParams({
    id: counterId,
    metrics: 'ym:s:visits,ym:s:bounceRate,ym:s:avgVisitDurationSeconds',
    date1: '28daysAgo',
    date2: 'today',
  })
  const res = await fetch(
    `https://api-metrika.yandex.net/stat/v1/data?${params.toString()}`,
    { headers: { Authorization: `OAuth ${accessToken}` } }
  )
  if (!res.ok) return null
  const data = await res.json() as {
    totals?: number[]
  }
  const t = data.totals
  if (!t || t.length < 3) return null
  return {
    visits: Math.round(t[0]),
    bounceRate: t[1],
    avgDuration: t[2],
  }
}
