import 'server-only'
import type { ScanGoal } from '@/types/scan'

const COLD_START_RETRY_DELAYS = [8000, 12000] // ms between retries during Railway cold start

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function dispatchScanToRailway(
  scanId: string,
  url: string,
  scanGoal?: ScanGoal,
  userLocale?: string,
): Promise<void> {
  const railwayUrl = process.env.RAILWAY_SCANNER_URL
  const scannerSecret = process.env.SCANNER_SECRET

  if (!railwayUrl || !scannerSecret) {
    throw new Error('Railway scanner is not configured')
  }

  const body = JSON.stringify({ url, scanId, scanGoal, userLocale })
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${scannerSecret}`,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= COLD_START_RETRY_DELAYS.length; attempt++) {
    if (attempt > 0) {
      await sleep(COLD_START_RETRY_DELAYS[attempt - 1])
    }

    const response = await fetch(`${railwayUrl}/api/run-scan`, {
      method: 'POST',
      headers,
      body,
    })

    if (response.ok) return

    const responseBody = await response.text().catch(() => '')

    // Railway returns 404 "Application not found" during cold start — retry
    if (response.status === 404 && attempt < COLD_START_RETRY_DELAYS.length) {
      console.warn(`[scan] Railway cold start detected (attempt ${attempt + 1}), retrying in ${COLD_START_RETRY_DELAYS[attempt]}ms`)
      lastError = new Error(`Railway scanner error ${response.status}: ${responseBody}`)
      continue
    }

    throw new Error(`Railway scanner error ${response.status}: ${responseBody}`)
  }

  throw lastError ?? new Error('Railway scanner failed after retries')
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
