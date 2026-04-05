import * as cheerio from 'cheerio'
import sslChecker from 'ssl-checker'
import type { Issue } from '@/types/scan'

function makeIssue(
  id: string,
  category: Issue['category'],
  severity: Issue['severity'],
  title: string,
  plainEnglish: string,
  value?: string,
): Issue {
  return {
    id,
    category,
    severity,
    title,
    description: title,
    plainEnglish,
    cursorPrompt: '',
    boltPrompt: '',
    ...(value ? { value } : {}),
  }
}

export async function runSecurityChecks(url: string, html: string): Promise<Issue[]> {
  try {
    const issues: Issue[] = []

    // Early exit — no HTTPS at all
    if (!url.startsWith('https://')) {
      return [
        makeIssue(
          'no-https',
          'security',
          'critical',
          'Site not served over HTTPS',
          'Your site uses plain HTTP. Browsers warn users about it, search engines rank it lower, and any data sent between visitors and your server is unencrypted.',
        ),
      ]
    }

    // Fetch headers
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const h = res.headers

    if (!h.get('strict-transport-security')) {
      issues.push(
        makeIssue(
          'missing-hsts',
          'security',
          'high',
          'HSTS header missing',
          'Without HSTS, browsers can be tricked into loading your site over plain HTTP even when HTTPS is available. Add the Strict-Transport-Security header.',
        ),
      )
    }

    if (!h.get('x-frame-options')) {
      issues.push(
        makeIssue(
          'missing-x-frame',
          'security',
          'medium',
          'X-Frame-Options header missing',
          'Your page can be embedded in an iframe on any other site. This enables clickjacking attacks where users think they\'re clicking your UI but they\'re really clicking something else.',
        ),
      )
    }

    if (!h.get('x-content-type-options')) {
      issues.push(
        makeIssue(
          'missing-xcto',
          'security',
          'medium',
          'X-Content-Type-Options header missing',
          'Browsers may try to guess the type of files you serve and execute them unexpectedly. The nosniff header prevents this.',
        ),
      )
    }

    if (!h.get('referrer-policy')) {
      issues.push(
        makeIssue(
          'missing-referrer-policy',
          'security',
          'low',
          'Referrer-Policy header missing',
          'When users click links leaving your site, their browser sends your full URL to the destination. Set a Referrer-Policy to control how much information is shared.',
        ),
      )
    }

    const csp = h.get('content-security-policy')
    if (!csp) {
      issues.push(
        makeIssue(
          'missing-csp',
          'security',
          'high',
          'Content Security Policy missing',
          'Without a CSP header, your site has no protection against cross-site scripting (XSS) attacks — malicious scripts injected into your pages.',
        ),
      )
    } else if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
      issues.push(
        makeIssue(
          'unsafe-csp',
          'security',
          'high',
          'Content Security Policy uses unsafe directives',
          "Your CSP includes 'unsafe-inline' or 'unsafe-eval', which largely defeats the purpose of having a CSP. These allow inline scripts and eval() — common XSS vectors.",
        ),
      )
    }

    // SSL expiry
    const domain = new URL(url).hostname
    try {
      const ssl = await sslChecker(domain, { timeout: 5000 })
      if (ssl.daysRemaining < 30) {
        issues.push(
          makeIssue(
            'ssl-expiring',
            'security',
            'high',
            'SSL certificate expiring soon',
            `Your SSL certificate expires in ${ssl.daysRemaining} days. When it expires, all visitors will see a browser warning and your site will be inaccessible to most users.`,
            `${ssl.daysRemaining} days`,
          ),
        )
      }
    } catch {
      // SSL check failure is non-fatal — skip
    }

    // Exposed sensitive files
    const origin = new URL(url).origin
    for (const file of ['.env', '.env.local', '.env.production', '.git/config']) {
      try {
        const r = await fetch(`${origin}/${file}`, { signal: AbortSignal.timeout(3000) })
        if (r.status === 200) {
          const text = await r.text()
          if (text.includes('=') && !text.includes('<html')) {
            issues.push(
              makeIssue(
                'exposed-env-file',
                'security',
                'critical',
                'Environment file publicly accessible',
                'Your API keys and passwords are visible to anyone right now. Attackers scan for this automatically — rotate your keys immediately.',
                file,
              ),
            )
            break
          }
        }
      } catch {
        // Unreachable file is fine — skip
      }
    }

    // API keys in HTML — log type, never the key itself
    const keyPatterns = [
      { re: /sk-[a-zA-Z0-9]{20,}/, name: 'OpenAI key' },
      { re: /pk_live_[a-zA-Z0-9]{20,}/, name: 'Stripe live key' },
      { re: /AIzaSy[a-zA-Z0-9_-]{33}/, name: 'Google API key' },
      { re: /ghp_[a-zA-Z0-9]{36}/, name: 'GitHub token' },
      { re: /AKIA[0-9A-Z]{16}/, name: 'AWS access key' },
    ]
    for (const { re, name } of keyPatterns) {
      if (re.test(html)) {
        console.warn(`[security] API key pattern detected in HTML: ${name}`)
        issues.push(
          makeIssue(
            'api-key-in-html',
            'security',
            'critical',
            'API key exposed in HTML source',
            `A ${name} was found in your page's HTML source. Anyone who views your source code can steal it and use it at your expense. Move it to server-side environment variables immediately.`,
            name,
          ),
        )
        break
      }
    }

    // Mixed content
    const $ = cheerio.load(html)
    if ($('script[src^="http://"], link[href^="http://"], img[src^="http://"]').length > 0) {
      issues.push(
        makeIssue(
          'mixed-content',
          'security',
          'high',
          'Mixed content detected',
          'Your HTTPS page loads some resources (scripts, stylesheets, or images) over plain HTTP. Browsers block these, breaking your site\'s functionality and appearance.',
        ),
      )
    }

    return issues
  } catch (err) {
    console.error('[security] Unexpected error in runSecurityChecks:', err)
    return []
  }
}
