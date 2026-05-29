import { describe, it, expect } from 'vitest'

// Extract slugify logic — same implementation used in admin/blog and admin/audits routes
function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

describe('slugify', () => {
  it('basic word', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('special characters stripped', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
  })

  it('multiple spaces collapsed', () => {
    expect(slugify('foo   bar')).toBe('foo-bar')
  })

  it('leading/trailing spaces trimmed', () => {
    expect(slugify('  hello  ')).toBe('hello')
  })

  it('already hyphenated', () => {
    expect(slugify('hello-world')).toBe('hello-world')
  })

  it('max length 80 chars', () => {
    const long = 'a'.repeat(100)
    expect(slugify(long).length).toBeLessThanOrEqual(80)
  })

  it('empty string', () => {
    expect(slugify('')).toBe('')
  })

  it('numbers preserved', () => {
    expect(slugify('Phase 64')).toBe('phase-64')
  })

  it('consecutive hyphens collapsed', () => {
    expect(slugify('foo--bar')).toBe('foo-bar')
  })
})
