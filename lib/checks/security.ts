import * as cheerio from 'cheerio'
import sslChecker from 'ssl-checker'
import { promises as dns } from 'dns'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { fetchSafeResource, type FetchContext } from '@/lib/checks/fetch-context'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'

const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.production',
  '.git/config',
  '.DS_Store',
]

const TRACKER_DOMAINS = [
  'google-analytics.com',
  'googletagmanager.com',
  'facebook.net',
  'hotjar.com',
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
]

function looksLikeEnvFile(text: string) {
  const sample = text.slice(0, 3000)
  if (sample.includes('<html') || sample.includes('<!doctype')) return false
  return /^[A-Z0-9_]+=/m.test(sample)
}

async function resolveTxt(hostname: string): Promise<string[][]> {
  try {
    return await dns.resolveTxt(hostname)
  } catch {
    return []
  }
}

export async function runSecurityChecks(
  url: string,
  html: string,
  context: Pick<FetchContext, 'headers'>,
): Promise<Issue[]> {
  try {
    const issues: Issue[] = []

    if (!url.startsWith('https://')) {
      return [withIssueMeta({ ...T['no-https'] }, 'http', [evidence('status', 'Protocol', 'http')])]
    }

    const headers = context.headers

    if (!headers.get('strict-transport-security')) {
      issues.push(withIssueMeta({ ...T['missing-hsts'] }, 'http', [evidence('header', 'Strict-Transport-Security', 'missing')]))
    }
    if (!headers.get('x-frame-options')) {
      issues.push(withIssueMeta({ ...T['missing-x-frame'] }, 'http', [evidence('header', 'X-Frame-Options', 'missing')]))
    }
    if (!headers.get('x-content-type-options')) {
      issues.push(withIssueMeta({ ...T['missing-xcto'] }, 'http', [evidence('header', 'X-Content-Type-Options', 'missing')]))
    }
    if (!headers.get('referrer-policy')) {
      issues.push(withIssueMeta({ ...T['missing-referrer-policy'] }, 'http', [evidence('header', 'Referrer-Policy', 'missing')]))
    }

    const csp = headers.get('content-security-policy')
    if (!csp) {
      issues.push(withIssueMeta({ ...T['missing-csp'] }, 'http', [evidence('header', 'Content-Security-Policy', 'missing')]))
    } else {
      // Only flag unsafe-inline/eval in script-src (or default-src fallback).
      // style-src 'unsafe-inline' is a separate, lower-risk concern (blocks CSS injection, not JS execution).
      const directives = Object.fromEntries(
        csp.split(';')
          .map(d => d.trim())
          .filter(Boolean)
          .map(d => {
            const spaceIdx = d.indexOf(' ')
            return spaceIdx === -1
              ? [d.toLowerCase(), '']
              : [d.slice(0, spaceIdx).toLowerCase(), d.slice(spaceIdx + 1)]
          }),
      )
      const effectiveScriptPolicy = directives['script-src'] ?? directives['default-src'] ?? ''
      if (effectiveScriptPolicy.includes("'unsafe-inline'") || effectiveScriptPolicy.includes("'unsafe-eval'")) {
        issues.push(withIssueMeta({ ...T['unsafe-csp'] }, 'http', [evidence('header', 'Content-Security-Policy', csp)]))
      }
    }

    const domain = new URL(url).hostname
    try {
      const ssl = await sslChecker(domain, { timeout: 5000 })
      if (ssl.daysRemaining < 30) {
        issues.push(withIssueMeta(
          { ...T['ssl-expiring'], value: `${ssl.daysRemaining} days` },
          'ssl',
          [evidence('metric', 'SSL days remaining', ssl.daysRemaining)],
        ))
      }
    } catch {
      // non-fatal
    }

    const origin = new URL(url).origin
    const probeResults = await Promise.allSettled(
      SENSITIVE_FILES.map(async (file) => {
        const response = await fetchSafeResource(`${origin}/${file}`, { signal: AbortSignal.timeout(2500) })
        if (response.status !== 200) return null
        const text = await response.text()
        return looksLikeEnvFile(text) ? file : null
      }),
    )
    const exposedFile = probeResults.find(
      (result): result is PromiseFulfilledResult<string | null> => result.status === 'fulfilled' && !!result.value,
    )?.value

    if (exposedFile) {
      issues.push(withIssueMeta(
        { ...T['exposed-env-file'], value: exposedFile },
        'http',
        [
          evidence('response', 'Sensitive file status', 200),
          evidence('text', 'Exposed path', exposedFile),
        ],
      ))
    }

    const keyPatterns = [
      { re: /sk-[A-Za-z0-9]{20,}/, name: 'OpenAI-like key' },
      { re: /pk_live_[A-Za-z0-9]{20,}/, name: 'Stripe live key' },
      { re: /AIzaSy[A-Za-z0-9_-]{33}/, name: 'Google API key' },
      { re: /ghp_[A-Za-z0-9]{36}/, name: 'GitHub token' },
      { re: /AKIA[0-9A-Z]{16}/, name: 'AWS access key' },
    ]
    for (const { re, name } of keyPatterns) {
      const match = html.match(re)
      if (!match) continue
      issues.push(withIssueMeta(
        { ...T['api-key-in-html'], value: name },
        'dom',
        [evidence('text', 'Matched pattern type', name)],
      ))
      break
    }

    const $ = cheerio.load(html)
    const hasMixedContent =
      $('script[src^="http://"], link[href^="http://"], img[src^="http://"], iframe[src^="http://"]').length > 0 ||
      /\bhttps?:\/\/[^"' )]+/i.test(
        $('style').text() + ' ' + $('[style]').map((_, el) => $(el).attr('style') ?? '').get().join(' '),
      ) && /\bhttp:\/\//i.test(
        $('style').text() + ' ' + $('[style]').map((_, el) => $(el).attr('style') ?? '').get().join(' '),
      )

    if (hasMixedContent) {
      issues.push(withIssueMeta({ ...T['mixed-content'] }, 'dom', [evidence('text', 'Mixed content', 'http:// resource detected')]))
    }

    if (!headers.get('permissions-policy')) {
      issues.push(withIssueMeta({ ...T['missing-permissions-policy'] }, 'http', [evidence('header', 'Permissions-Policy', 'missing')]))
    }

    // ── DNS / Email security checks ─────────────────────────────
    const apexDomain = domain.startsWith('www.') ? domain.slice(4) : domain

    const txtRecords = await resolveTxt(apexDomain)
    const spfRecord = txtRecords.flat().find(r => r.startsWith('v=spf1'))
    if (!spfRecord) {
      issues.push(withIssueMeta(
        { ...T['missing-spf'] },
        'http',
        [evidence('text', 'SPF record', 'not found'), evidence('text', 'Domain', apexDomain)],
      ))
    }

    const dmarcRecords = await resolveTxt(`_dmarc.${apexDomain}`)
    const dmarcRecord = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1'))
    if (!dmarcRecord) {
      issues.push(withIssueMeta(
        { ...T['missing-dmarc'] },
        'http',
        [evidence('text', 'DMARC record', 'not found'), evidence('text', 'Checked', `_dmarc.${apexDomain}`)],
      ))
    } else {
      const policyMatch = dmarcRecord.match(/p=(\w+)/i)
      const policy = policyMatch?.[1]?.toLowerCase()
      if (policy === 'none') {
        issues.push(withIssueMeta(
          { ...T['weak-dmarc-policy'], value: 'p=none' },
          'http',
          [evidence('text', 'DMARC record', dmarcRecord.slice(0, 80)), evidence('text', 'Policy', 'none (monitoring only)')],
        ))
      }
    }

    let caaFound = false
    try {
      const caa = await dns.resolveCaa(apexDomain)
      caaFound = caa.length > 0
    } catch {
      caaFound = false
    }
    if (!caaFound) {
      issues.push(withIssueMeta(
        { ...T['missing-caa'] },
        'http',
        [evidence('text', 'CAA record', 'not found'), evidence('text', 'Domain', apexDomain)],
      ))
    }

    // ── Cookie security flags ────────────────────────────────────
    const rawSetCookies: string[] = (() => {
      if (typeof (headers as unknown as Record<string, unknown>).getSetCookie === 'function') {
        return (headers as unknown as { getSetCookie(): string[] }).getSetCookie()
      }
      const single = headers.get('set-cookie')
      return single ? [single] : []
    })()

    if (rawSetCookies.length > 0) {
      const cookiesWithoutSecure = rawSetCookies.filter(c => !/;\s*secure/i.test(c))
      const cookiesWithoutHttpOnly = rawSetCookies.filter(c => !/;\s*httponly/i.test(c))
      const cookiesWithoutSameSite = rawSetCookies.filter(c => !/;\s*samesite=/i.test(c))

      if (cookiesWithoutSecure.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-secure'], value: `${cookiesWithoutSecure.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without Secure flag', cookiesWithoutSecure.length)],
        ))
      }
      if (cookiesWithoutHttpOnly.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-httponly'], value: `${cookiesWithoutHttpOnly.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without HttpOnly flag', cookiesWithoutHttpOnly.length)],
        ))
      }
      if (cookiesWithoutSameSite.length > 0) {
        issues.push(withIssueMeta(
          { ...T['cookie-missing-samesite'], value: `${cookiesWithoutSameSite.length} cookie(s)` },
          'http',
          [evidence('count', 'Cookies without SameSite', cookiesWithoutSameSite.length)],
        ))
      }
    }

    // ── .git/HEAD probe ──────────────────────────────────────────
    try {
      const gitHeadRes = await fetchSafeResource(`${origin}/.git/HEAD`, { signal: AbortSignal.timeout(2500) })
      if (gitHeadRes.status === 200) {
        const gitHeadText = await gitHeadRes.text()
        if (gitHeadText.startsWith('ref:') || /^[0-9a-f]{40}/m.test(gitHeadText)) {
          issues.push(withIssueMeta(
            { ...T['exposed-git-head'] },
            'http',
            [
              evidence('response', '/.git/HEAD status', 200),
              evidence('text', 'Content preview', gitHeadText.slice(0, 40).trim()),
            ],
          ))
        }
      }
    } catch {
      // non-fatal
    }

    // ── Source map probe ─────────────────────────────────────────
    const sourceMappingMatch = html.match(/sourceMappingURL=([^\s"']+\.map)/)
    if (sourceMappingMatch) {
      const mapPath = sourceMappingMatch[1]
      const mapUrl = mapPath.startsWith('http') ? mapPath : `${origin}/${mapPath.replace(/^\//, '')}`
      try {
        const safeMapUrl = new URL(mapUrl)
        if (safeMapUrl.origin === origin) {
          const mapRes = await fetchSafeResource(mapUrl, { signal: AbortSignal.timeout(2500) })
          if (mapRes.status === 200) {
            const mapText = await mapRes.text()
            if (mapText.includes('"sources"') || mapText.includes('"sourceRoot"')) {
              issues.push(withIssueMeta(
                { ...T['exposed-source-map'], value: mapPath },
                'http',
                [
                  evidence('response', 'Source map status', 200),
                  evidence('text', 'Map URL', mapUrl.replace(origin, '')),
                ],
              ))
            }
          }
        }
      } catch {
        // non-fatal
      }
    }

    // ── GraphQL introspection probe ──────────────────────────────
    const gqlPaths = ['/graphql', '/api/graphql', '/v1/graphql']
    const introspectionQuery = encodeURIComponent('{ __schema { types { name } } }')
    for (const gqlPath of gqlPaths) {
      try {
        const gqlRes = await fetchSafeResource(
          `${origin}${gqlPath}?query=${introspectionQuery}`,
          { signal: AbortSignal.timeout(3000) },
        )
        if (gqlRes.status === 200) {
          const gqlBody = await gqlRes.json().catch(() => null)
          if (gqlBody?.data?.__schema?.types) {
            issues.push(withIssueMeta(
              { ...T['graphql-introspection-open'], value: gqlPath },
              'http',
              [
                evidence('response', 'GraphQL introspection status', 200),
                evidence('text', 'Endpoint', gqlPath),
              ],
            ))
            break
          }
        }
      } catch {
        // non-fatal
      }
    }

    const trackerScripts = $('script[src]').toArray().filter((el) => {
      const src = $(el).attr('src') ?? ''
      try {
        const hostname = new URL(src).hostname
        return TRACKER_DOMAINS.some(domain => hostname.includes(domain))
      } catch {
        return false
      }
    })

    if (trackerScripts.length > 0) {
      issues.push(withIssueMeta(
        { ...T['third-party-trackers'], value: `${trackerScripts.length} tracker${trackerScripts.length === 1 ? '' : 's'}` },
        'dom',
        [evidence('count', 'Tracker scripts found', trackerScripts.length)],
      ))
    }

    const hasTrackers = trackerScripts.length > 0 ||
      $('script:not([src])').toArray().some(el =>
        ['gtag', 'ga(', '_gaq', 'fbq', 'hj(', 'mixpanel', 'analytics'].some(kw =>
          ($(el).html() ?? '').includes(kw)
        )
      )

    const hasConsentBanner =
      $('[class*="cookie"],[id*="cookie"],[class*="consent"],[id*="consent"],[class*="gdpr"],[id*="gdpr"]').length > 0 ||
      $('#onetrust-consent-sdk,.cc-window,#CybotCookiebotDialog').length > 0

    if (hasTrackers && !hasConsentBanner) {
      issues.push(withIssueMeta(
        { ...T['missing-cookie-consent'] },
        'dom',
        [evidence('text', 'Tracking detected without consent banner', 'no consent pattern found')],
      ))
    }

    const hasPrivacyLink = $('a[href]').toArray().some((el) => {
      const href = ($(el).attr('href') ?? '').toLowerCase()
      const text = ($(el).text() ?? '').toLowerCase()
      return href.includes('/privacy') || href.includes('/datenschutz') ||
        text.includes('privacy policy') || text.includes('политика')
    })

    if (!hasPrivacyLink) {
      issues.push(withIssueMeta(
        { ...T['missing-privacy-policy'] },
        'dom',
        [evidence('selector', 'a[href*=privacy]', 'missing')],
      ))
    }

    return issues
  } catch (err) {
    console.error('[security] Unexpected error in runSecurityChecks:', err)
    return []
  }
}
