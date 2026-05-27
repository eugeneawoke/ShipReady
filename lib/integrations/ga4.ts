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
