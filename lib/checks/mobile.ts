import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'

export async function runMobileChecks(html: string): Promise<Issue[]> {
  const $ = cheerio.load(html)
  const issues: Issue[] = []

  const viewport = $('meta[name="viewport"]').attr('content') ?? ''

  if (!viewport) {
    issues.push(withIssueMeta({ ...T['missing-viewport'] }, 'dom', [evidence('selector', 'meta[name=viewport]', 'missing')]))
  } else if (viewport.includes('user-scalable=no')) {
    issues.push(withIssueMeta({ ...T['blocking-viewport'] }, 'dom', [evidence('text', 'Viewport content', viewport)]))
  }

  if (!$('link[rel*="icon"]').first().attr('href')) {
    issues.push(withIssueMeta({ ...T['missing-favicon'] }, 'dom', [evidence('selector', 'link[rel*=icon]', 'missing')]))
  }

  if (!$('link[rel="apple-touch-icon"]').length) {
    issues.push(withIssueMeta({ ...T['missing-touch-icon'] }, 'dom', [evidence('selector', 'link[rel="apple-touch-icon"]', 'missing')]))
  }

  if (!$('link[rel="manifest"]').length) {
    issues.push(withIssueMeta(
      { ...T['missing-web-manifest'] },
      'dom',
      [evidence('selector', 'link[rel=manifest]', 'missing')],
    ))
  }

  const telLinks = $('a[href^="tel:"]')
  const bodyText = $('body').clone().find('script, style, noscript').remove().end().text()
  const phonePattern = /\+?[\d][\d\s\-\(\)]{8,}[\d]/g
  const phoneMatches = bodyText.match(phonePattern) ?? []
  const likelyPhones = phoneMatches.filter(m => m.replace(/\D/g, '').length >= 10)

  if (likelyPhones.length > 0 && telLinks.length === 0) {
    issues.push(withIssueMeta(
      { ...T['phone-numbers-not-linked'], value: `${likelyPhones.length} found` },
      'dom',
      [evidence('count', 'Phone patterns found', likelyPhones.length)],
    ))
  }

  return issues
}
