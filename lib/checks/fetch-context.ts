import { assertSafeScanUrl } from '@/lib/server/url-safety'

export interface FetchContext {
  requestedUrl: string
  finalUrl: string
  html: string
  headers: Headers
  status: number
  durationMs: number
  /** True when TLS verification failed and the fetch fell back to lenient mode */
  tlsError?: boolean
}

// SSL error codes that indicate a broken cert chain — safe to retry without verification
const TLS_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'SELF_SIGNED_CERT_IN_CHAIN',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
])

function isTlsError(err: unknown): boolean {
  if (!(err instanceof TypeError)) return false
  const cause = (err as { cause?: { code?: string } }).cause
  return !!cause?.code && TLS_ERROR_CODES.has(cause.code)
}

function fetchValidatedResource(safeUrl: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers as HeadersInit | undefined)
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'Glook-Scanner/1.0 (website audit; +https://glook.dev)')
  }
  return fetch(safeUrl, {
    ...init,
    headers,
    redirect: 'manual',
  })
}

async function fetchLenientResource(safeUrl: string, init: RequestInit = {}): Promise<Response> {
  // Use undici Agent with TLS verification disabled — only for sites with broken cert chains
  const { Agent } = await import('undici')
  const agent = new Agent({ connect: { rejectUnauthorized: false } })
  return fetch(safeUrl, {
    ...init,
    redirect: 'manual',
    // @ts-expect-error undici dispatcher is not in standard fetch types
    dispatcher: agent,
  })
}

export async function fetchSafeResource(url: string, init: RequestInit = {}): Promise<Response> {
  const safeUrl = await assertSafeScanUrl(url)
  return fetchValidatedResource(safeUrl, init)
}

export async function fetchPrimaryContext(url: string): Promise<FetchContext> {
  const safeUrl = await assertSafeScanUrl(url)
  const started = Date.now()

  let response: Response
  let tlsError = false

  try {
    response = await fetchValidatedResource(safeUrl, {
      signal: AbortSignal.timeout(10000),
    })
  } catch (err) {
    if (!isTlsError(err)) throw err
    // Broken cert chain — retry without TLS verification so the scan can continue.
    // The SSL issue itself will be caught and reported by the security check (ssl-checker).
    console.warn(`[fetch-context] TLS error for ${safeUrl}, retrying without certificate verification`)
    tlsError = true
    response = await fetchLenientResource(safeUrl, {
      signal: AbortSignal.timeout(10000),
    })
  }

  const html = await response.text()

  return {
    requestedUrl: url,
    finalUrl: response.url || safeUrl,
    html,
    headers: response.headers,
    status: response.status,
    durationMs: Date.now() - started,
    tlsError,
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
    // Fall through to GET for: 405 Method Not Allowed, 403 Forbidden, any 3xx redirect
    // (redirect: 'manual' returns raw 3xx — do a GET to actually follow/check)
    const shouldFallToGet =
      head.status === 405 ||
      head.status === 403 ||
      (head.status >= 300 && head.status < 400)
    if (!shouldFallToGet) {
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
