// lib/integrations/ga4.ts

export interface Ga4TrafficResult {
  sessions: number
  bounceRate: number
  avgSessionDuration: number
}

export async function fetchGa4Traffic(
  accessToken: string,
  propertyId: string
): Promise<Ga4TrafficResult | null> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
        metrics: [
          { name: 'sessions' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      }),
    }
  )
  if (!res.ok) return null
  const data = await res.json() as {
    totals?: Array<{ metricValues?: Array<{ value: string }> }>
  }
  const values = data.totals?.[0]?.metricValues
  if (!values || values.length < 3) return null
  return {
    sessions: parseInt(values[0].value ?? '0', 10),
    bounceRate: parseFloat(values[1].value ?? '0'),
    avgSessionDuration: parseFloat(values[2].value ?? '0'),
  }
}

async function fetchGa4DataStreamUris(
  accessToken: string,
  propertyId: string,
): Promise<string[]> {
  const res = await fetch(
    `https://analyticsadmin.googleapis.com/v1beta/${propertyId}/dataStreams`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return []
  const data = await res.json() as {
    dataStreams?: Array<{ webStreamData?: { defaultUri?: string } }>
  }
  return (data.dataStreams ?? [])
    .map(s => s.webStreamData?.defaultUri ?? '')
    .filter(Boolean)
}

// Returns numeric property ID (e.g. "123456789") for the given domain,
// or null if none of the user's GA4 properties match.
export async function findGa4PropertyForDomain(
  accessToken: string,
  domain: string,
): Promise<string | null> {
  const res = await fetch(
    'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
    { headers: { Authorization: `Bearer ${accessToken}` } },
  )
  if (!res.ok) return null
  const data = await res.json() as {
    accountSummaries?: Array<{
      propertySummaries?: Array<{ property: string }>
    }>
  }

  const propertyRefs = (data.accountSummaries ?? []).flatMap(
    a => a.propertySummaries ?? [],
  )

  for (const { property } of propertyRefs) {
    // property is "properties/123456789"
    const uris = await fetchGa4DataStreamUris(accessToken, property)
    if (uris.some(uri => uri.includes(domain))) {
      return property.replace('properties/', '')
    }
  }
  return null
}
