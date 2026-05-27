import { createHmac, timingSafeEqual } from 'crypto'

function secret(): string {
  const s = process.env.OAUTH_STATE_SECRET
  if (!s) throw new Error('OAUTH_STATE_SECRET env var is not set')
  return s
}

export function createState(userId: string, returnTo: string = '/dashboard'): string {
  const payload = Buffer.from(
    JSON.stringify({ userId, returnTo, exp: Date.now() + 10 * 60 * 1000 })
  ).toString('base64url')
  const sig = createHmac('sha256', secret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyState(state: string): { userId: string; returnTo: string } | null {
  const dot = state.lastIndexOf('.')
  if (dot === -1) return null
  const payload = state.slice(0, dot)
  const sig = state.slice(dot + 1)
  const expected = createHmac('sha256', secret()).update(payload).digest('base64url')
  try {
    if (!timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) {
      return null
    }
  } catch {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString())
    if (Date.now() > parsed.exp) return null
    return { userId: parsed.userId, returnTo: parsed.returnTo }
  } catch {
    return null
  }
}
