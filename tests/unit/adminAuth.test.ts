import { describe, it, expect, beforeEach, afterEach } from 'vitest'

// Mirror of the adminAuth function used in all /api/admin/* routes
function adminAuth(authHeader: string | null, secret: string | undefined): boolean {
  if (!secret) return false
  if (!authHeader) return false
  return authHeader === `Bearer ${secret}`
}

describe('adminAuth', () => {
  const SECRET = 'test-secret-abc123'

  it('correct bearer token → true', () => {
    expect(adminAuth(`Bearer ${SECRET}`, SECRET)).toBe(true)
  })

  it('wrong token → false', () => {
    expect(adminAuth('Bearer wrong-token', SECRET)).toBe(false)
  })

  it('empty auth header → false', () => {
    expect(adminAuth('', SECRET)).toBe(false)
  })

  it('null auth header → false', () => {
    expect(adminAuth(null, SECRET)).toBe(false)
  })

  it('no ADMIN_SECRET configured → false', () => {
    expect(adminAuth(`Bearer ${SECRET}`, undefined)).toBe(false)
  })

  it('token without Bearer prefix → false', () => {
    expect(adminAuth(SECRET, SECRET)).toBe(false)
  })

  it('token with extra whitespace → false', () => {
    expect(adminAuth(`Bearer ${SECRET} `, SECRET)).toBe(false)
  })
})
