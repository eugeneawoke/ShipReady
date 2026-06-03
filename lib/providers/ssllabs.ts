export interface SSLLabsResult {
  grade: string | null
  hasOldProtocol: boolean
  hasWeakCipher: boolean
  ipAddress: string | null
}

type SSLLabsProviderResult =
  | { ok: true; data: SSLLabsResult }
  | { ok: false; status: 'unavailable' | 'failed'; message: string }

interface SSLLabsEndpoint {
  grade?: string
  ipAddress?: string
  details?: {
    protocols?: Array<{ id: number; name: string; version: string }>
    suites?: Array<{ list?: Array<{ name: string }> }>
  }
}

interface SSLLabsResponse {
  status?: string
  endpoints?: SSLLabsEndpoint[]
}

export async function fetchSSLLabsData(
  hostname: string,
  timeoutMs = 35_000,
): Promise<SSLLabsProviderResult> {
  const apiUrl = new URL('https://api.ssllabs.com/api/v3/analyze')
  apiUrl.searchParams.set('host', hostname)
  apiUrl.searchParams.set('publish', 'off')
  apiUrl.searchParams.set('all', 'done')
  apiUrl.searchParams.set('ignoreMismatch', 'on')

  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: { 'User-Agent': 'Glook/1.0 site-audit-tool' },
    })

    if (!res.ok) {
      return { ok: false, status: 'failed', message: `SSL Labs returned ${res.status}` }
    }

    const data = await res.json() as SSLLabsResponse

    if (data.status !== 'READY') {
      return {
        ok: false,
        status: 'unavailable',
        message: `SSL Labs assessment status: ${data.status ?? 'unknown'} (may need retry)`,
      }
    }

    const endpoints = data.endpoints ?? []
    const firstEndpoint = endpoints[0]
    if (!firstEndpoint) {
      return { ok: false, status: 'unavailable', message: 'No SSL Labs endpoints returned' }
    }

    const grade = firstEndpoint.grade ?? null
    const protocols = firstEndpoint.details?.protocols ?? []
    const hasOldProtocol = protocols.some(p => {
      const version = parseFloat(p.version)
      return p.name === 'TLS' && version < 1.2
    })

    const allSuites = firstEndpoint.details?.suites?.flatMap(s => s.list ?? []) ?? []
    const WEAK_CIPHER_PATTERNS = [/RC4/i, /DES(?!-\w*GCM)/i, /EXPORT/i, /NULL/i, /anon/i]
    const hasWeakCipher = allSuites.some(suite =>
      WEAK_CIPHER_PATTERNS.some(p => p.test(suite.name ?? '')),
    )

    return {
      ok: true,
      data: {
        grade,
        hasOldProtocol,
        hasWeakCipher,
        ipAddress: firstEndpoint.ipAddress ?? null,
      },
    }
  } catch (error) {
    return {
      ok: false,
      status: 'failed',
      message: error instanceof Error ? error.message : 'SSL Labs request failed',
    }
  }
}
