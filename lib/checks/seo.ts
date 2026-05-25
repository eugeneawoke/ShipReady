import * as cheerio from 'cheerio'
import { XMLParser } from 'fast-xml-parser'
import robotsParser from 'robots-parser'
import type { BusinessContext, Issue } from '@/types/scan'
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
  options?: {
    includeLikely?: boolean
    includeHeuristics?: boolean
    businessContext?: BusinessContext | null
  },
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

  // SPA / empty-shell detection
  if (includeHeuristics) {
    const bodyClone = $('body').clone()
    bodyClone.find('script, style, noscript').remove()
    const bodyText = bodyClone.text().trim()
    const hasRootDiv = $('div#root, div#app, div#__next').length > 0
    const wordCount = bodyText.split(/\s+/).filter(Boolean).length
    const scriptCount = $('script').length
    if (hasRootDiv && wordCount < 50 && scriptCount >= 1) {
      issues.push(withIssueMeta(
        { ...T['spa-no-ssr'] },
        'dom',
        [
          evidence('count', 'Readable words in HTML', wordCount),
          evidence('selector', 'Root SPA element', 'div#root / div#app detected'),
        ],
      ))
    }
  }

  // Analytics detection
  if (includeHeuristics) {
    const htmlStr = $.html()
    const hasGA4 = /googletagmanager\.com\/gtag\/js|gtag\('config'/.test(htmlStr)
    const hasGTM = /googletagmanager\.com\/gtm\.js|GTM-[A-Z0-9]+/.test(htmlStr)
    const hasYandexMetrika = /mc\.yandex\.ru\/metrika|Ya\.Metrika/.test(htmlStr)
    if (!hasGA4 && !hasGTM && !hasYandexMetrika) {
      issues.push(withIssueMeta(
        { ...T['missing-analytics'] },
        'dom',
        [evidence('text', 'Analytics scripts found', 'none detected')],
      ))
    }
  }

  // Keyword-in-page check via businessContext
  const bc = options?.businessContext
  if (bc?.businessProfile || bc?.detectedService) {
    const titleText = $('title').text().toLowerCase()
    const h1Text = $('h1').first().text().toLowerCase()
    const description = bc.businessProfile ?? bc.detectedService ?? ''
    const keywords: string[] = description.toLowerCase().split(/\s+/).filter(w => w.length > 4).slice(0, 3)
    const foundInTitle = keywords.some(kw => titleText.includes(kw))
    const foundInH1 = keywords.some(kw => h1Text.includes(kw))
    if (!foundInTitle && !foundInH1) {
      issues.push(withIssueMeta(
        { ...T['keywords-not-in-title'] },
        'dom',
        [
          evidence('text', 'Title', $('title').text().slice(0, 80)),
          evidence('text', 'H1', $('h1').first().text().slice(0, 80)),
        ],
      ))
    }
  }

  // ── Sitemap quality ──────────────────────────────────────────
  try {
    const { fetchSafeResource: fetchSitemapResource } = await import('@/lib/checks/fetch-context')
    const seoOrigin = new URL(url).origin
    const sitemapRes = await fetchSitemapResource(`${seoOrigin}/sitemap.xml`, { signal: AbortSignal.timeout(3000) })

    if (sitemapRes.ok) {
      const sitemapXml = await sitemapRes.text()
      const parser = new XMLParser({ ignoreAttributes: false })
      const parsed = parser.parse(sitemapXml) as Record<string, unknown>

      const urlset = parsed?.urlset as Record<string, unknown> | undefined
      const sitemapUrls: unknown[] = urlset?.url
        ? (Array.isArray(urlset.url) ? urlset.url : [urlset.url])
        : []

      if (sitemapUrls.length === 0) {
        issues.push(withIssueMeta(
          { ...T['sitemap-empty'] },
          'http',
          [evidence('response', 'sitemap.xml status', 200), evidence('count', 'URLs found', 0)],
        ))
      } else if (includeHeuristics) {
        const sixMonthsAgo = Date.now() - 180 * 24 * 60 * 60 * 1000
        const urlsWithLastmod = sitemapUrls.filter((u): u is Record<string, unknown> =>
          typeof u === 'object' && u !== null && 'lastmod' in u,
        )
        if (urlsWithLastmod.length > 0) {
          const allStale = urlsWithLastmod.every((u) => {
            const lm = u.lastmod
            if (!lm || typeof lm !== 'string') return true
            const d = new Date(lm)
            return !isNaN(d.getTime()) && d.getTime() < sixMonthsAgo
          })
          if (allStale) {
            const oldestDateStr = urlsWithLastmod
              .map(u => String(u.lastmod))
              .sort()
              .at(-1) ?? 'unknown'
            issues.push(withIssueMeta(
              { ...T['sitemap-lastmod-stale'], value: `last updated ${oldestDateStr}` },
              'http',
              [evidence('text', 'Most recent lastmod', oldestDateStr), evidence('count', 'URLs checked', urlsWithLastmod.length)],
            ))
          }
        }
      }
    }
  } catch {
    // non-fatal
  }

  // ── Robots.txt quality ───────────────────────────────────────
  try {
    const { fetchSafeResource: fetchRobotsResource } = await import('@/lib/checks/fetch-context')
    const seoOrigin = new URL(url).origin
    const robotsRes = await fetchRobotsResource(`${seoOrigin}/robots.txt`, { signal: AbortSignal.timeout(2500) })

    if (robotsRes.ok) {
      const robotsText = await robotsRes.text()
      const robotsUrl = `${seoOrigin}/robots.txt`
      const robots = robotsParser(robotsUrl, robotsText)

      const homeUrl = `${seoOrigin}/`
      const isHomeBlocked =
        robots.isDisallowed(homeUrl, 'Googlebot') ||
        robots.isDisallowed(homeUrl, '*')

      if (isHomeBlocked) {
        issues.push(withIssueMeta(
          { ...T['robots-disallow-all'] },
          'http',
          [evidence('text', 'robots.txt', 'Disallow: / for * or Googlebot'), evidence('text', 'Checked URL', homeUrl)],
        ))
      }

      const hasSitemapDirective = /^Sitemap:/im.test(robotsText)
      if (!hasSitemapDirective) {
        issues.push(withIssueMeta(
          { ...T['robots-no-sitemap-directive'] },
          'http',
          [evidence('text', 'robots.txt Sitemap directive', 'missing')],
        ))
      }
    }
  } catch {
    // non-fatal
  }

  return issues
}
