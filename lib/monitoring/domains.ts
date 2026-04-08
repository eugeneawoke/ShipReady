export function normalizeDomain(input: string): string {
  const trimmed = input.trim()
  if (!trimmed) throw new Error('Domain is required')

  try {
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`)

    const hostname = url.hostname.toLowerCase()
    if (!hostname || hostname.length > 253) {
      throw new Error('Invalid domain')
    }
    return hostname
  } catch {
    throw new Error('Invalid domain')
  }
}

export function urlsForDomain(domain: string): string[] {
  return [
    `https://${domain}`,
    `http://${domain}`,
    `https://${domain}/%`,
    `http://${domain}/%`,
  ]
}
