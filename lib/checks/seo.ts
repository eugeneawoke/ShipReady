import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { isValidUrl } from '@/lib/utils'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'
import { fetchSafeResource, fetchWithHeadFallback } from '@/lib/checks/fetch-context'

export async function runSEOChecks(
  url: string,
  html: string,
  options?: { includeLikely?: boolean; includeHeuristics?: boolean },
): Promise<Issue[]> {
  const includeLikely = options?.includeLikely ?? true
  const includeHeuristics = options?.includeHeuristics ?? true
  const $ = cheerio.load(html)
  const issues: Issue[] = []

  const title = $('title').text().trim()
  if (!title) {
    issues.push(withIssueMeta({ ...T['missing-title'] }, 'dom', [evidence('selector', 'title', 'missing')]))
  } else if (includeHeuristics && (title.length < 30 || title.length > 60)) {
    issues.push(withIssueMeta(
      { ...T['title-length'], value: `${title.length} chars` },
      'dom',
      [evidence('text', 'Title text', title), evidence('count', 'Title length', title.length)],
    ))
  }

  const desc = $('meta[name="description"]').attr('content')?.trim() ?? ''
  if (!desc) {
    issues.push(withIssueMeta({ ...T['missing-description'] }, 'dom', [evidence('selector', 'meta[name=description]', 'missing')]))
  }

  if (desc && includeHeuristics && (desc.length < 100 || desc.length > 165)) {
    issues.push(withIssueMeta(
      { ...T['desc-length'], value: `${desc.length} chars` },
      'dom',
      [evidence('text', 'Meta description', desc.slice(0, 80) + (desc.length > 80 ? '…' : '')), evidence('count', 'Length', desc.length)],
    ))
  }

  const h1s = $('h1')
  if (h1s.length !== 1) {
    issues.push(withIssueMeta(
      { ...T['missing-h1'], value: `${h1s.length} found` },
      'dom',
      [evidence('count', 'H1 count', h1s.length)],
    ))
  }

  const canonical = $('link[rel="canonical"]').attr('href')
  if (!canonical) {
    issues.push(withIssueMeta({ ...T['missing-canonical'] }, 'dom', [evidence('selector', 'link[rel=canonical]', 'missing')]))
  }

  if (canonical) {
    try {
      const canonicalHostname = new URL(canonical).hostname
      const pageHostname = new URL(url).hostname
      if (canonicalHostname !== pageHostname) {
        issues.push(withIssueMeta(
          { ...T['canonical-mismatch'], value: canonicalHostname },
          'dom',
          [evidence('text', 'Canonical domain', canonicalHostname), evidence('text', 'Page domain', pageHostname)],
        ))
      }
    } catch { /* invalid URL — ignore */ }
  }

  const ogTitle = $('meta[property="og:title"]').attr('content')
  if (!ogTitle) {
    issues.push(withIssueMeta({ ...T['missing-og-title'] }, 'dom', [evidence('selector', 'meta[property="og:title"]', 'missing')]))
  }

  const ogDescription = $('meta[property="og:description"]').attr('content')
  if (!ogDescription) {
    issues.push(withIssueMeta({ ...T['missing-og-description'] }, 'dom', [evidence('selector', 'meta[property="og:description"]', 'missing')]))
  }

  const ogImage = $('meta[property="og:image"]').attr('content')
  if (!ogImage) {
    issues.push(withIssueMeta({ ...T['missing-og-image'] }, 'dom', [evidence('selector', 'meta[property="og:image"]', 'missing')]))
  } else if (includeLikely && !isValidUrl(ogImage)) {
    issues.push(withIssueMeta(
      { ...T['og-image-invalid'], value: 'invalid URL' },
      'http',
      [evidence('text', 'og:image', ogImage)],
    ))
  } else if (includeLikely) {
    try {
      const result = await fetchWithHeadFallback(ogImage, 2500)
      if (!result.ok) {
        issues.push(withIssueMeta(
          { ...T['og-image-invalid'], value: `${result.status} via ${result.method}` },
          'http',
          [
            evidence('text', 'og:image', ogImage),
            evidence('response', `og:image ${result.method}`, result.status),
          ],
        ))
      }
    } catch {
      issues.push(withIssueMeta(
        { ...T['og-image-invalid'], value: 'request failed' },
        'http',
        [evidence('text', 'og:image', ogImage)],
      ))
    }
  }

  const twitterCard = $('meta[name="twitter:card"]').attr('content')
  if (!twitterCard) {
    issues.push(withIssueMeta({ ...T['missing-twitter-card'] }, 'dom', [evidence('selector', 'meta[name="twitter:card"]', 'missing')]))
  }

  const twitterImage = $('meta[name="twitter:image"]').attr('content') || $('meta[name="twitter:image:src"]').attr('content')
  if (includeLikely && twitterCard === 'summary_large_image' && !twitterImage) {
    issues.push(withIssueMeta(
      { ...T['missing-twitter-image'] },
      'dom',
      [evidence('text', 'twitter:card', twitterCard), evidence('selector', 'meta[name="twitter:image"]', 'missing')],
    ))
  }

  const body = $('body').clone()
  body.find('script, style, noscript, template').remove()
  const bodyText = body.text().toLowerCase()
  if (includeHeuristics && ['lorem ipsum', 'your name here'].some(phrase => bodyText.includes(phrase))) {
    issues.push(withIssueMeta(
      { ...T['placeholder-text'] },
      'dom',
      [evidence('text', 'Matched placeholder phrase', 'lorem ipsum / your name here')],
    ))
  }

  const jsonLdBlocks = $('script[type="application/ld+json"]').toArray()
  if (includeLikely && jsonLdBlocks.length === 0) {
    issues.push(withIssueMeta(
      { ...T['missing-structured-data'] },
      'dom',
      [evidence('selector', 'script[type="application/ld+json"]', 'missing')],
    ))
  }

  if (includeLikely && jsonLdBlocks.length > 0) {
    let hasWebApp = false
    let missingOS = false
    for (const el of jsonLdBlocks) {
      try {
        const data = JSON.parse($(el).html() || '{}')
        const schemas = Array.isArray(data) ? data : [data]
        for (const schema of schemas) {
          if (schema['@type'] === 'WebApplication' || schema['@type'] === 'SoftwareApplication') {
            hasWebApp = true
            if (!schema.operatingSystem) missingOS = true
          }
        }
      } catch { /* malformed JSON-LD */ }
    }
    if (hasWebApp && missingOS) {
      issues.push(withIssueMeta(
        { ...T['missing-operating-system'] },
        'dom',
        [evidence('selector', 'WebApplication.operatingSystem', 'missing')],
      ))
    }
  }

  if (includeLikely) {
    try {
      const origin = new URL(url).origin
      const robotsRes = await fetchSafeResource(`${origin}/robots.txt`, { signal: AbortSignal.timeout(3000) })
      if (robotsRes.ok) {
        const robotsText = await robotsRes.text()
        const sitemapMatch = robotsText.match(/^Sitemap:\s*(.+)$/im)
        if (sitemapMatch) {
          const sitemapUrl = sitemapMatch[1].trim()
          if (sitemapUrl.includes('//') && !sitemapUrl.startsWith('//')) {
            const afterProtocol = sitemapUrl.replace(/^https?:\/\//, '')
            if (afterProtocol.includes('//')) {
              issues.push(withIssueMeta(
                { ...T['sitemap-double-slash'], value: sitemapUrl },
                'http',
                [evidence('text', 'Sitemap URL in robots.txt', sitemapUrl)],
              ))
            }
          }
        }
      }
    } catch { /* robots.txt fetch failed — not an issue */ }
  }

  return issues
}
