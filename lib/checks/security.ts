import * as cheerio from 'cheerio'
import sslChecker from 'ssl-checker'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'
import { fetchSafeResource, type FetchContext } from '@/lib/checks/fetch-context'
import { evidence, withIssueMeta } from '@/lib/checks/issue-meta'

const SENSITIVE_FILES = ['.env', '.env.local', '.env.production', '.git/config']

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
