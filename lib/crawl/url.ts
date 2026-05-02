const DEFAULT_PORTS = new Map<string, string>([
  ['http:', '80'],
  ['https:', '443'],
])

export function normalizeCrawlUrl(input: string, baseUrl?: string): string | null {
  let parsed: URL

  try {
    parsed = baseUrl ? new URL(input, baseUrl) : new URL(input)
  } catch {
    return null
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return null
  }

  parsed.hash = ''
  parsed.username = ''
  parsed.password = ''
  parsed.hostname = parsed.hostname.toLowerCase()

  if (DEFAULT_PORTS.get(parsed.protocol) === parsed.port) {
    parsed.port = ''
  }

  const ordered = new URLSearchParams()
  const entries = [...parsed.searchParams.entries()].sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey === rightKey) return leftValue.localeCompare(rightValue)
    return leftKey.localeCompare(rightKey)
  })

  for (const [key, value] of entries) {
    ordered.append(key, value)
  }

  const query = ordered.toString()
  parsed.search = query ? `?${query}` : ''

  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')
  }

  return parsed.toString()
}

export function isSameOriginUrl(candidateUrl: string, originUrl: string): boolean {
  return new URL(candidateUrl).origin === new URL(originUrl).origin
}
