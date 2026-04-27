import 'server-only'
import type { ScanGoal } from '@/types/scan'

export async function dispatchScanToRailway(
  scanId: string,
  url: string,
  scanGoal?: ScanGoal,
): Promise<void> {
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
    body: JSON.stringify({ url, scanId, scanGoal }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Railway scanner error ${response.status}: ${body}`)
  }
}

export async function dispatchLighthouseRetryToRailway(scanId: string): Promise<void> {
  const railwayUrl = process.env.RAILWAY_SCANNER_URL
  const scannerSecret = process.env.SCANNER_SECRET

  if (!railwayUrl || !scannerSecret) {
    throw new Error('Railway scanner is not configured')
  }

  const response = await fetch(`${railwayUrl}/api/run-measurement`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${scannerSecret}`,
    },
    body: JSON.stringify({ scanId, measurement: 'lighthouse' }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Railway measurement retry error ${response.status}: ${body}`)
  }
}
