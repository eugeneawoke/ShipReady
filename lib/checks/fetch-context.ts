import { assertSafeScanUrl } from '@/lib/server/url-safety'

export interface FetchContext {
  requestedUrl: string
  finalUrl: string
  html: string
  headers: Headers
  status: number
  durationMs: number
}

function fetchValidatedResource(safeUrl: string, init: RequestInit = {}): Promise<Response> {
  return fetch(safeUrl, {
    ...init,
    redirect: 'manual',
  })
}

export async function fetchSafeResource(url: string, init: RequestInit = {}): Promise<Response> {
  const safeUrl = await assertSafeScanUrl(url)
  return fetchValidatedResource(safeUrl, init)
}

export async function fetchPrimaryContext(url: string): Promise<FetchContext> {
  const safeUrl = await assertSafeScanUrl(url)
  const started = Date.now()
  const response = await fetchValidatedResource(safeUrl, {
    signal: AbortSignal.timeout(10000),
  })
  const html = await response.text()

  return {
    requestedUrl: url,
    finalUrl: response.url || safeUrl,
    html,
    headers: response.headers,
    status: response.status,
    durationMs: Date.now() - started,
  }
}

export async function fetchWithHeadFallback(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; method: 'HEAD' | 'GET' }> {
  const safeUrl = await assertSafeScanUrl(url)

  try {
    const head = await fetchValidatedResource(safeUrl, {
      method: 'HEAD',
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (head.ok) {
      return { ok: true, status: head.status, method: 'HEAD' }
    }
    if (head.status !== 405 && head.status !== 403) {
      return { ok: false, status: head.status, method: 'HEAD' }
    }
  } catch {
    // fall through to GET
  }

  const get = await fetchValidatedResource(safeUrl, {
    method: 'GET',
    signal: AbortSignal.timeout(timeoutMs),
  })
  return { ok: get.ok, status: get.status, method: 'GET' }
}
