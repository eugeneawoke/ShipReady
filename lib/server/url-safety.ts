import 'server-only'

import dns from 'node:dns/promises'
import net from 'node:net'

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

function isPrivateIp(ip: string): boolean {
  const normalized = ip.toLowerCase()
  return PRIVATE_HOST_RE.some((re) => re.test(normalized))
}

async function resolveHostnameIps(hostname: string): Promise<string[]> {
  if (net.isIP(hostname)) return [hostname]

  const records = await dns.lookup(hostname, { all: true, verbatim: true })
  return [...new Set(records.map((record) => record.address))]
}

async function assertPublicHost(hostname: string): Promise<void> {
  if (PRIVATE_HOST_RE.some((re) => re.test(hostname))) {
    throw new Error('Blocked private host')
  }

  const ips = await resolveHostnameIps(hostname)
  if (ips.length === 0 || ips.some((ip) => isPrivateIp(ip))) {
    throw new Error('Blocked private network target')
  }
}

async function requestWithoutFollowing(url: string): Promise<Response> {
  const controller = AbortSignal.timeout(5000)

  try {
    return await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: controller,
    })
  } catch {
    return fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller,
    })
  }
}

export async function assertSafeScanUrl(url: string): Promise<string> {
  const target = new URL(url)

  if (!['http:', 'https:'].includes(target.protocol)) {
    throw new Error('Unsupported protocol')
  }

  if (target.username || target.password) {
    throw new Error('Embedded credentials are not allowed')
  }

  let current = target

  for (let hop = 0; hop < 5; hop++) {
    await assertPublicHost(current.hostname)

    const response = await requestWithoutFollowing(current.toString())
    const isRedirect =
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has('location')

    if (!isRedirect) {
      return current.toString()
    }

    current = new URL(response.headers.get('location')!, current)
  }

  throw new Error('Too many redirects')
}
