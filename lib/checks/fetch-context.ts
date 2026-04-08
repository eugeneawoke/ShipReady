export interface FetchContext {
  requestedUrl: string
  finalUrl: string
  html: string
  headers: Headers
  status: number
  durationMs: number
}

export async function fetchPrimaryContext(url: string): Promise<FetchContext> {
  const started = Date.now()
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  const html = await response.text()

  return {
    requestedUrl: url,
    finalUrl: response.url || url,
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
  try {
    const head = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(timeoutMs) })
    if (head.ok) {
      return { ok: true, status: head.status, method: 'HEAD' }
    }
    if (head.status !== 405 && head.status !== 403) {
      return { ok: false, status: head.status, method: 'HEAD' }
    }
  } catch {
    // fall through to GET
  }

  const get = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) })
  return { ok: get.ok, status: get.status, method: 'GET' }
}
