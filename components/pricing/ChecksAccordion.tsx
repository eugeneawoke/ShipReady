'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

type CheckCategory = {
  id: string
  name: string
  color: string
  count: number
  checks: string[]
}

// Priority order: SEO → AI Visibility → Security → Performance → Mobile → Accessibility
const CATEGORIES: CheckCategory[] = [
  {
    id: 'seo',
    name: 'SEO & Social',
    color: '#22C55E',
    count: 28,
    checks: [
      'Missing title tag',
      'Title length out of range',
      'Missing meta description',
      'Meta description length out of range',
      'Missing H1',
      'Missing canonical URL',
      'Canonical URL mismatch',
      'Canonical double slash',
      'Missing OG title',
      'Missing OG description',
      'Missing OG image',
      'Missing OG URL',
      'OG image invalid',
      'OG URL mismatch',
      'Sensitive page indexable',
      'Page marked noindex',
      'Meta robots noindex',
      'Images missing alt text',
      'Images missing dimensions',
      'Placeholder text detected',
      'Broken links',
      'Missing sitemap.xml',
      'Sitemap empty',
      'Sitemap lastmod stale',
      'Robots.txt blocks crawlers',
      'Robots.txt disallow all',
      'Robots.txt missing sitemap directive',
      'Missing Schema.org structured data',
      'Schema missing required fields',
      'Poor heading hierarchy',
      'Thin content',
      'Thin internal linking',
      'No semantic HTML',
      'Content JS-only (no SSR)',
      'Keywords not in title',
      'Missing analytics',
    ],
  },
  {
    id: 'ai',
    name: 'AI Visibility',
    color: '#A855F7',
    count: 15,
    checks: [
      'Missing llms.txt',
      'llms.txt too thin',
      'llms.txt missing description',
      'llms.txt missing sections',
      'llms.txt broken links',
      'AI crawlers blocked (all)',
      'GPTBot blocked',
      'OAI-SearchBot blocked',
      'ClaudeBot / anthropic-ai blocked',
      'PerplexityBot blocked',
      'DeepSeekBot blocked',
      'GEO: answer not in first paragraph',
      'GEO: no question headings (FAQ)',
      'GEO: missing date freshness signal',
      'GEO: missing org sameAs entity',
    ],
  },
  {
    id: 'security',
    name: 'Security',
    color: '#EF4444',
    count: 29,
    checks: [
      'No HTTPS',
      'Missing HSTS header',
      'Missing X-Frame-Options',
      'Missing X-Content-Type-Options',
      'Missing Referrer-Policy',
      'Missing Content-Security-Policy',
      'Unsafe CSP (unsafe-inline/eval)',
      'Missing Permissions-Policy',
      'SSL certificate expiring soon',
      'TLS old protocol (TLS 1.0/1.1)',
      'TLS weak cipher suite',
      'Low TLS grade',
      'Exposed .env file',
      'Exposed .git/HEAD file',
      'Exposed source map (.js.map)',
      'API key pattern in HTML',
      'Mixed content (HTTP on HTTPS)',
      'GraphQL introspection open',
      'Vulnerable JS library (CVE)',
      'Missing SPF DNS record',
      'Missing DMARC DNS record',
      'Weak DMARC policy',
      'Missing CAA DNS record',
      'Cookie missing Secure flag',
      'Cookie missing HttpOnly flag',
      'Cookie missing SameSite flag',
      'Missing cookie consent banner',
      'Missing privacy policy',
      'Third-party trackers without consent',
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    color: '#F97316',
    count: 5,
    checks: [
      'LCP > 2.5s (Largest Contentful Paint)',
      'CLS > 0.1 (Cumulative Layout Shift)',
      'INP > 200ms (Interaction to Next Paint)',
      'FCP > 1.8s (First Contentful Paint)',
      'Performance score below 70',
    ],
  },
  {
    id: 'mobile',
    name: 'Mobile',
    color: '#3B82F6',
    count: 8,
    checks: [
      'Missing viewport meta tag',
      'Viewport blocks user scaling',
      'Missing favicon',
      'Missing web app manifest',
      'Phone numbers not linked (tel:)',
      'Small tap targets (< 44px)',
      'Font size too small on mobile',
      'Redirect chain detected',
    ],
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    color: '#22D3EE',
    count: 7,
    checks: [
      'Accessibility score below 70',
      'Images missing alt text (a11y)',
      'Form inputs without labels',
      'Buttons without accessible labels',
      'Missing lang attribute on <html>',
      'Missing skip navigation link',
      'SPA with no server-side rendering',
    ],
  },
]

export function ChecksAccordion({ locale }: { locale: string }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const totalChecks = CATEGORIES.reduce((sum, c) => sum + c.count, 0)

  const heading = locale === 'ru' ? 'Все проверки' : 'Full checks list'
  const sub = locale === 'ru'
    ? `${totalChecks} проверок реализовано — по всем 6 категориям`
    : `${totalChecks} checks implemented across all 6 categories`

  return (
    <div className="mt-14">
      <div className="mb-5">
        <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono mb-2">
          {heading}
        </p>
        <p className="text-[#5A5955] text-sm">{sub}</p>
      </div>

      <div className="space-y-1.5">
        {CATEGORIES.map(cat => {
          const isOpen = openId === cat.id
          return (
            <div
              key={cat.id}
              className="rounded-xl border border-white/[0.06] bg-[#161618] overflow-hidden transition-colors duration-150 hover:border-white/[0.10]"
              style={isOpen ? { borderColor: `${cat.color}25` } : undefined}
            >
              <button
                onClick={() => setOpenId(isOpen ? null : cat.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-sm font-medium text-[#F1F0EE]">{cat.name}</span>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded font-mono border tabular-nums"
                    style={{
                      color: cat.color,
                      borderColor: `${cat.color}30`,
                      background: `${cat.color}12`,
                    }}
                  >
                    {cat.count}
                  </span>
                </div>
                <ChevronDown
                  className="w-4 h-4 text-[#5A5955] shrink-0 transition-transform duration-250 ease-out"
                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>

              {/* CSS grid trick for smooth height animation — no max-height hack */}
              <div
                className="grid transition-[grid-template-rows] duration-250 ease-out"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-1 border-t border-white/[0.05]">
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {cat.checks.map(check => (
                        <span
                          key={check}
                          className="text-[11px] px-2 py-0.5 rounded-md bg-[#1E1E21] border border-white/[0.06] text-[#8B8A85] font-mono leading-relaxed"
                        >
                          {check}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
