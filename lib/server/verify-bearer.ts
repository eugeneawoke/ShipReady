import 'server-only'
import { timingSafeEqual } from 'crypto'

/**
 * Timing-safe comparison of Bearer tokens.
 * Prevents side-channel attacks where === short-circuits on the first differing char.
 */
export function verifyBearerToken(provided: string | null, secret: string | undefined): boolean {
  if (!secret || !provided) return false
  const expected = `Bearer ${secret}`
  if (provided.length !== expected.length) return false
  try {
    return timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  } catch {
    return false
  }
}
