// lib/integrations/bing-webmaster.ts

export interface BingIndexingResult {
  inIndex: number
  crawlErrors: number
  blockedUrls: number
}

export async function fetchBingIndexing(
  accessToken: string,
  siteUrl: string
): Promise<BingIndexingResult | null> {
  const params = new URLSearchParams({ siteUrl })
  const res = await fetch(
    `https://ssl.bing.com/webmaster/api.svc/json/GetCrawlStats?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    }
  )
  if (!res.ok) return null
  const data = await res.json() as {
    d?: {
      InIndex?: number
      CrawlErrors?: number
      BlockedUrls?: number
    }
  }
  const d = data.d
  if (!d) return null
  return {
    inIndex: d.InIndex ?? 0,
    crawlErrors: d.CrawlErrors ?? 0,
    blockedUrls: d.BlockedUrls ?? 0,
  }
}
