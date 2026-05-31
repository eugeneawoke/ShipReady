import { describe, it, expect } from 'vitest'

// Mirror of PRIVATE_HOST_RE from lib/server/url-safety.ts
// Cannot import directly due to 'server-only' pragma
const PRIVATE_HOST_RE = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/i,
  /^fc00:/i,
  /^fd00:/i,
  /^fe80:/i,
  /^metadata\.google\.internal$/i,
]

function isPrivateHost(host: string): boolean {
  return PRIVATE_HOST_RE.some(re => re.test(host.toLowerCase()))
}

function isValidScanUrl(rawUrl: string): { ok: boolean; reason?: string } {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, reason: `blocked protocol: ${parsed.protocol}` }
  }
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'credentials in URL' }
  }
  if (isPrivateHost(parsed.hostname)) {
    return { ok: false, reason: 'private host' }
  }
  return { ok: true }
}

describe('private host detection', () => {
  it('localhost blocked', () => expect(isPrivateHost('localhost')).toBe(true))
  it('127.0.0.1 blocked', () => expect(isPrivateHost('127.0.0.1')).toBe(true))
  it('10.0.0.1 blocked', () => expect(isPrivateHost('10.0.0.1')).toBe(true))
  it('192.168.1.1 blocked', () => expect(isPrivateHost('192.168.1.1')).toBe(true))
  it('172.16.0.1 blocked', () => expect(isPrivateHost('172.16.0.1')).toBe(true))
  it('169.254.0.1 blocked', () => expect(isPrivateHost('169.254.0.1')).toBe(true))
  it('metadata.google.internal blocked', () => expect(isPrivateHost('metadata.google.internal')).toBe(true))
  it('::1 blocked', () => expect(isPrivateHost('::1')).toBe(true))
  it('public IP allowed', () => expect(isPrivateHost('8.8.8.8')).toBe(false))
  it('public domain allowed', () => expect(isPrivateHost('example.com')).toBe(false))
})

describe('URL validation', () => {
  it('valid https URL passes', () => {
    expect(isValidScanUrl('https://example.com').ok).toBe(true)
  })

  it('valid http URL passes', () => {
    expect(isValidScanUrl('http://example.com').ok).toBe(true)
  })

  it('javascript: protocol blocked', () => {
    expect(isValidScanUrl('javascript:alert(1)').ok).toBe(false)
  })

  it('file:// protocol blocked', () => {
    expect(isValidScanUrl('file:///etc/passwd').ok).toBe(false)
  })

  it('ftp:// protocol blocked', () => {
    expect(isValidScanUrl('ftp://example.com').ok).toBe(false)
  })

  it('localhost blocked via URL', () => {
    expect(isValidScanUrl('http://localhost:3000').ok).toBe(false)
  })

  it('credentials in URL blocked', () => {
    expect(isValidScanUrl('https://user:pass@example.com').ok).toBe(false)
  })

  it('completely invalid string fails', () => {
    expect(isValidScanUrl('not-a-url').ok).toBe(false)
  })

  it('empty string fails', () => {
    expect(isValidScanUrl('').ok).toBe(false)
  })
})
