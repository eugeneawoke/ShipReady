import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Patterns that match private/internal network hosts — used to block SSRF
const PRIVATE_HOST_RE = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,            // link-local / AWS instance metadata
  /^::1$/,                  // IPv6 loopback
  /^fc00:/i,                // IPv6 private
  /^fe80:/i,                // IPv6 link-local
  /^metadata\.google\.internal$/i,
]

export function isValidUrl(url: string): boolean {
  if (!url || url.length > 2048) return false
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    // Block embedded credentials (http://user:pass@host)
    if (u.username || u.password) return false
    // Block private/internal addresses (SSRF protection)
    if (PRIVATE_HOST_RE.some(re => re.test(u.hostname))) return false
    return true
  } catch {
    return false
  }
}

export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url
  }
  return url
}
