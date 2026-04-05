import * as cheerio from 'cheerio'
import sslChecker from 'ssl-checker'
import type { Issue } from '@/types/scan'
import { T } from '@/lib/ai/issue-templates'

export async function runSecurityChecks(url: string, html: string): Promise<Issue[]> {
  try {
    const issues: Issue[] = []

    // Early exit — no HTTPS at all
    if (!url.startsWith('https://')) {
      return [{ ...T['no-https'] }]
    }

    // Fetch headers
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    const h = res.headers

    if (!h.get('strict-transport-security')) {
      issues.push({ ...T['missing-hsts'] })
    }

    if (!h.get('x-frame-options')) {
      issues.push({ ...T['missing-x-frame'] })
    }

    if (!h.get('x-content-type-options')) {
      issues.push({ ...T['missing-xcto'] })
    }

    if (!h.get('referrer-policy')) {
      issues.push({ ...T['missing-referrer-policy'] })
    }

    const csp = h.get('content-security-policy')
    if (!csp) {
      issues.push({ ...T['missing-csp'] })
    } else if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
      issues.push({ ...T['unsafe-csp'] })
    }

    // SSL expiry
    const domain = new URL(url).hostname
    try {
      const ssl = await sslChecker(domain, { timeout: 5000 })
      if (ssl.daysRemaining < 30) {
        issues.push({ ...T['ssl-expiring'], value: `${ssl.daysRemaining} days` })
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
            issues.push({ ...T['exposed-env-file'], value: file })
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
        issues.push({ ...T['api-key-in-html'], value: name })
        break
      }
    }

    // Mixed content
    const $ = cheerio.load(html)
    if ($('script[src^="http://"], link[href^="http://"], img[src^="http://"]').length > 0) {
      issues.push({ ...T['mixed-content'] })
    }

    return issues
  } catch (err) {
    console.error('[security] Unexpected error in runSecurityChecks:', err)
    return []
  }
}
