import 'server-only'

export async function dispatchScanToRailway(scanId: string, url: string): Promise<void> {
  const railwayUrl = process.env.RAILWAY_SCANNER_URL
  const scannerSecret = process.env.SCANNER_SECRET

  if (!railwayUrl || !scannerSecret) {
    throw new Error('Railway scanner is not configured')
  }

  const response = await fetch(`${railwayUrl}/api/run-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scannerSecret}`,
    },
    body: JSON.stringify({ url, scanId }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Railway scanner error ${response.status}: ${body}`)
  }
}
