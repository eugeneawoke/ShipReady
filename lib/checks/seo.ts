import * as cheerio from 'cheerio'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { isValidUrl } from '@/lib/utils'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'

function parsePageUrl(value: string | undefined, baseUrl: string): URL | null {
  if (!value) return null
  try {
    return new URL(value, baseUrl)
  } catch {
    return null
  }
}

function hasDoubleSlashPath(url: URL): boolean {
  return url.pathname.includes('//')
}

function isSensitivePath(pathname: string): boolean {
  return /^\/(report|dashboard|account|admin|scan)(\/|$)/i.test(pathname)
}

function hasNoindexDirective(content: string | undefined): boolean {
  return /\bnoindex\b/i.test(content ?? '')
}

function isPathDisallowedByRobots(robotsText: string, pagePath: string): boolean {
  const lines = robotsText.split('\n').map(l => l.trim())
  let inRelevantBlock = false
  const disallowRules: string[] = []

  for (const line of lines) {
    if (/^user-agent:\s*(\*|googlebot)$/i.test(line)) {
      inRelevantBlock = true
    } else if (/^user-agent:/i.test(line)) {
      inRelevantBlock = false
    } else if (inRelevantBlock && /^disallow:/i.test(line)) {
      const rule = line.replace(/^disallow:\s*/i, '').trim()
      if (rule) disallowRules.push(rule)
    }
  }

  return disallowRules.some(rule => pagePath.startsWith(rule))
}

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

  const robots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content')
  const pagePath = new URL(url).pathname
  const pageNoindex = hasNoindexDirective(robots)
  if (isSensitivePath(pagePath) && !pageNoindex) {
    issues.push(withIssueMeta(
      { ...T['sensitive-page-indexable'], value: pagePath },
      'dom',
      [evidence('text', 'Sensitive route', pagePath), evidence('selector', 'meta[name=robots] noindex', 'missing')],
    ))
  } else if (!isSensitivePath(pagePath) && pageNoindex) {
    issues.push(withIssueMeta(
      { ...T['page-noindex'], value: robots ?? 'noindex' },
      'dom',
      [evidence('text', 'Robots directive', robots ?? 'noindex')],
    ))
  }

  if (pageNoindex) {
    issues.push(withIssueMeta(
      { ...T['meta-robots-noindex'], value: robots ?? 'noindex' },
      'dom',
      [evidence('text', 'Robots directive', robots ?? 'noindex')],
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
    const canonicalUrl = parsePageUrl(canonical, url)
    if (canonicalUrl) {
      if (hasDoubleSlashPath(canonicalUrl)) {
        issues.push(withIssueMeta(
          { ...T['canonical-double-slash'], value: canonicalUrl.toString() },
          'dom',
          [evidence('text', 'Canonical URL', canonicalUrl.toString())],
        ))
      }
      const canonicalHostname = canonicalUrl.hostname
      const pageHostname = new URL(url).hostname
      if (canonicalHostname !== pageHostname) {
        issues.push(withIssueMeta(
          { ...T['canonical-mismatch'], value: canonicalHostname },
          'dom',
          [evidence('text', 'Canonical domain', canonicalHostname), evidence('text', 'Page domain', pageHostname)],
        ))
      }
      if (includeLikely && canonicalUrl.hostname === new URL(url).hostname) {
        const normalizeUrl = (u: URL) => `${u.origin}${u.pathname.replace(/\/$/, '')}`
        const normalizedCanonical = normalizeUrl(canonicalUrl)
        const normalizedPage = normalizeUrl(new URL(url))
        if (normalizedCanonical !== normalizedPage) {
          issues.push(withIssueMeta(
            { ...T['canonical-url-mismatch'], value: canonicalUrl.pathname },
            'dom',
            [
              evidence('text', 'Canonical URL', canonicalUrl.toString()),
              evidence('text', 'Page URL', url),
            ],
          ))
        }
      }
    }
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
  const ogUrl = $('meta[property="og:url"]').attr('content')
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
      const { fetchWithHeadFallback } = await import('@/lib/checks/fetch-context')
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

  // ── seo-og-image-dimensions ─────────────────────────────
  if (includeLikely) {
    const ogImageUrl = $('meta[property="og:image"]').attr('content')
    if (ogImageUrl) {
      const ogWidth = $('meta[property="og:image:width"]').attr('content')
      const ogHeight = $('meta[property="og:image:height"]').attr('content')
      if (!ogWidth || !ogHeight) {
        issues.push(withIssueMeta(
          { ...T['seo-og-image-dimensions'] },
          'dom',
          [
            evidence('selector', 'og:image', ogImageUrl.slice(0, 80)),
            evidence('selector', 'og:image:width / og:image:height', 'missing'),
          ],
        ))
      }
    }
  }

  if (!ogUrl) {
    issues.push(withIssueMeta({ ...T['missing-og-url'] }, 'dom', [evidence('selector', 'meta[property="og:url"]', 'missing')]))
  } else {
    const parsedOgUrl = parsePageUrl(ogUrl, url)
    if (parsedOgUrl) {
      if (hasDoubleSlashPath(parsedOgUrl)) {
        issues.push(withIssueMeta(
          { ...T['og-url-double-slash'], value: parsedOgUrl.toString() },
          'dom',
          [evidence('text', 'og:url', parsedOgUrl.toString())],
        ))
      }
      const pageHostname = new URL(url).hostname
      if (parsedOgUrl.hostname !== pageHostname) {
        issues.push(withIssueMeta(
          { ...T['og-url-mismatch'], value: parsedOgUrl.hostname },
          'dom',
          [evidence('text', 'og:url domain', parsedOgUrl.hostname), evidence('text', 'Page domain', pageHostname)],
        ))
      }
    }
  }

  const twitterCard = $('meta[name="twitter:card"]').attr('content')
  if (!twitterCard) {
    issues.push(withIssueMeta({ ...T['missing-twitter-card'] }, 'dom', [evidence('selector', 'meta[name="twitter:card"]', 'missing')]))
  }

  const twitterImage = $('meta[name="twitter:image"]').attr('content') || $('meta[name="twitter:image:src"]').attr('content')
  if (twitterCard === 'summary_large_image' && !twitterImage) {
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

  const images = $('img').toArray()
  const missingAlt = images.filter((el) => {
    const img = $(el)
    const isDecorative = img.attr('role') === 'presentation' || img.attr('aria-hidden') === 'true' || img.attr('alt') === ''
    return !isDecorative && img.attr('alt') == null
  })
  if (missingAlt.length > 0) {
    issues.push(withIssueMeta(
      { ...T['image-missing-alt'], value: `${missingAlt.length} images` },
      'dom',
      [evidence('count', 'Images missing alt', missingAlt.length)],
    ))
  }

  const missingDimensions = images.filter((el) => {
    const img = $(el)
    const style = img.attr('style') ?? ''
    return (!img.attr('width') || !img.attr('height')) && !/aspect-ratio\s*:/i.test(style)
  })
  if (missingDimensions.length > 0) {
    issues.push(withIssueMeta(
      { ...T['image-missing-dimensions'], value: `${missingDimensions.length} images` },
      'dom',
      [evidence('count', 'Images missing dimensions', missingDimensions.length)],
    ))
  }

  if (includeHeuristics) {
    const emptyAltNonDecorative = images.filter((el) => {
      const img = $(el)
      const isDecorative = img.attr('role') === 'presentation' || img.attr('aria-hidden') === 'true'
      return !isDecorative && img.attr('alt') === ''
    })
    if (emptyAltNonDecorative.length > 0) {
      issues.push(withIssueMeta(
        { ...T['images-missing-alt'], value: `${emptyAltNonDecorative.length} images` },
        'dom',
        [evidence('count', 'Images with empty alt', emptyAltNonDecorative.length)],
      ))
    }
  }

  if (includeHeuristics) {
    const pageHostname = new URL(url).hostname
    const internalLinks = $('body a[href]').toArray().filter((el) => {
      const href = $(el).attr('href') ?? ''
      if (href.startsWith('/') || href.startsWith('#')) return true
      try {
        return new URL(href).hostname === pageHostname
      } catch {
        return false
      }
    })
    if (internalLinks.length < 3) {
      issues.push(withIssueMeta(
        { ...T['thin-internal-linking'], value: `${internalLinks.length} links` },
        'dom',
        [evidence('count', 'Internal links found', internalLinks.length)],
      ))
    }
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
      const { fetchSafeResource } = await import('@/lib/checks/fetch-context')
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
        const robotsPagePath = new URL(url).pathname
        if (isPathDisallowedByRobots(robotsText, robotsPagePath)) {
          issues.push(withIssueMeta(
            { ...T['robots-txt-disallow'], value: robotsPagePath },
            'http',
            [evidence('text', 'Disallowed path', robotsPagePath)],
          ))
        }
      }
    } catch { /* robots.txt fetch failed — not an issue */ }
  }

  return issues
}
