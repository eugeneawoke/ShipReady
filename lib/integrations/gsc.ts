// lib/integrations/gsc.ts

export interface GscIndexingResult {
  indexed: boolean
  coverage: string
  lastCrawled: string | null
}

export interface GscSite {
  siteUrl: string
  permissionLevel: string
}

export async function fetchGscIndexing(
  accessToken: string,
  siteUrl: string,
  inspectUrl: string
): Promise<GscIndexingResult | null> {
  const encodedSite = encodeURIComponent(siteUrl)
  const res = await fetch(
    `https://searchconsole.googleapis.com/v1/sites/${encodedSite}/urlInspection/index:inspect`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inspectionUrl: inspectUrl, siteUrl }),
    }
  )
  if (!res.ok) return null
  const data = await res.json() as {
    urlInspectionResult?: {
      indexStatusResult?: {
        verdict?: string
        coverageState?: string
        lastCrawlTime?: string
      }
    }
  }
  const r = data.urlInspectionResult?.indexStatusResult
  if (!r) return null
  return {
    indexed: r.verdict === 'PASS',
    coverage: r.coverageState ?? 'Unknown',
    lastCrawled: r.lastCrawlTime ?? null,
  }
}

export async function fetchGscSites(accessToken: string): Promise<GscSite[]> {
  const res = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const data = await res.json() as { siteEntry?: GscSite[] }
  return data.siteEntry ?? []
}
