'use client'

import { useState } from 'react'
import React from 'react'
import { Zap, Search, Shield, Smartphone, Bot, ChevronDown } from 'lucide-react'
import type { CategoryScore, IssueCategory } from '@/types/scan'

const ICONS: Record<IssueCategory, React.ComponentType<{ className?: string }>> = {
  performance: Zap,
  seo: Search,
  security: Shield,
  mobile: Smartphone,
  ai_visibility: Bot,
}

const LABELS: Record<IssueCategory, string> = {
  performance: 'Performance',
  seo: 'SEO & Social',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
}

const DESCRIPTIONS: Record<IssueCategory, string> = {
  performance: 'Page speed, Core Web Vitals, and accessibility — measured by Lighthouse',
  seo: 'Search discoverability, meta tags, and how your links look when shared',
  security: 'HTTPS config, HTTP security headers, SSL certificate, and exposed credentials',
  mobile: 'Mobile viewport, favicon, and home screen icon',
  ai_visibility: 'Findability in ChatGPT, Perplexity, and Google AI Overview',
}

const ALL_CHECKS: Record<IssueCategory, { id: string; name: string }[]> = {
  performance: [
    { id: 'lcp-slow', name: 'LCP under 2.5s (main content loads fast)' },
    { id: 'cls-high', name: 'No layout shifts (CLS)' },
    { id: 'inp-slow', name: 'Fast click response (INP under 200ms)' },
    { id: 'fcp-slow', name: 'First paint under 1.8s (FCP)' },
    { id: 'perf-score-low', name: 'Lighthouse performance score ≥70' },
    { id: 'a11y-score-low', name: 'Accessibility score ≥70' },
  ],
  seo: [
    { id: 'missing-title', name: 'Title tag present' },
    { id: 'title-length', name: 'Title 30–60 characters' },
    { id: 'missing-description', name: 'Meta description present' },
    { id: 'missing-h1', name: 'Single H1 heading' },
    { id: 'missing-canonical', name: 'Canonical URL set' },
    { id: 'missing-og-title', name: 'Open Graph title' },
    { id: 'missing-og-description', name: 'Open Graph description' },
    { id: 'missing-og-image', name: 'Open Graph image' },
    { id: 'og-image-invalid', name: 'OG image accessible (returns 200)' },
    { id: 'missing-twitter-card', name: 'Twitter/X card meta tag' },
    { id: 'placeholder-text', name: 'No placeholder text' },
    { id: 'broken-links', name: 'No broken internal links' },
  ],
  security: [
    { id: 'no-https', name: 'HTTPS enabled' },
    { id: 'missing-hsts', name: 'HSTS header (force HTTPS)' },
    { id: 'missing-x-frame', name: 'X-Frame-Options (clickjacking protection)' },
    { id: 'missing-xcto', name: 'X-Content-Type-Options header' },
    { id: 'missing-referrer-policy', name: 'Referrer-Policy header' },
    { id: 'missing-csp', name: 'Content-Security-Policy header' },
    { id: 'unsafe-csp', name: 'Safe CSP (no unsafe-inline/eval)' },
    { id: 'ssl-expiring', name: 'SSL certificate valid for 30+ days' },
    { id: 'exposed-env-file', name: 'No exposed .env files' },
    { id: 'api-key-in-html', name: 'No API keys in HTML source' },
    { id: 'mixed-content', name: 'No mixed HTTP/HTTPS content' },
  ],
  mobile: [
    { id: 'missing-viewport', name: 'Viewport meta tag present' },
    { id: 'blocking-viewport', name: 'Viewport allows user scaling' },
    { id: 'missing-favicon', name: 'Favicon present' },
    { id: 'missing-touch-icon', name: 'Apple touch icon' },
  ],
  ai_visibility: [
    { id: 'missing-schema-org', name: 'Schema.org structured data' },
    { id: 'missing-faq-schema', name: 'FAQ schema markup' },
    { id: 'poor-heading-hierarchy', name: 'Proper heading hierarchy (H1→H2→H3)' },
    { id: 'thin-content', name: 'Sufficient content (300+ words)' },
    { id: 'missing-llms-txt', name: 'llms.txt file present' },
    { id: 'ai-crawlers-blocked', name: 'AI crawlers allowed in robots.txt' },
    { id: 'missing-sitemap', name: 'Sitemap.xml present' },
    { id: 'missing-author-entity', name: 'Author or organization entity' },
  ],
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4444',
  high: '#FF8C42',
  medium: '#F5C518',
  low: '#4A9EFF',
}

interface CategoryCardProps {
  category: IssueCategory
  data: CategoryScore
}

export function CategoryCard({ category, data }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(true)
  const [passedOpen, setPassedOpen] = useState(false)
  const Icon = ICONS[category]
  const labelColor =
    data.score === null ? '#8B8A85'
    : data.score >= 90 ? '#3DDC84'
    : data.score >= 70 ? '#7BC67E'
    : data.score >= 50 ? '#F5C518'
    : '#FF4444'

  const labelMap: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    'needs-work': 'Needs work',
    poor: 'Poor',
    unavailable: 'Unavailable',
  }

  const failedIds = new Set(data.issues.map(i => i.id))
  const passedChecks = ALL_CHECKS[category].filter(c => !failedIds.has(c.id))

  function scrollToIssue(issueId: string) {
    const el = document.getElementById(`issue-${issueId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.transition = 'box-shadow 0.2s ease'
    el.style.boxShadow = '0 0 0 2px #6E56CF'
    setTimeout(() => { el.style.boxShadow = '' }, 1200)
  }

  return (
    <div className="category-card rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className="w-4 h-4 text-[#8B8A85] shrink-0 mt-0.5" />
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-medium block">{LABELS[category]}</span>
          <span className="text-xs text-[#5A5955] leading-snug">{DESCRIPTIONS[category]}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24 h-1.5 bg-white/6 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.score ?? 0}%`, background: labelColor }}
            />
          </div>
          <span className="font-mono text-sm" style={{ color: labelColor }}>
            {data.score ?? '—'}
          </span>
          <span className="text-xs text-[#5A5955]">/100</span>
          <span className="text-xs text-[#8B8A85] hidden sm:inline">
            {labelMap[data.label]}
          </span>
          <ChevronDown
            className="w-4 h-4 text-[#5A5955] transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Issues list */}
      {expanded && (
        <div className="border-t border-white/6">
          {data.measurement && data.measurement.status !== 'measured' && (
            <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <p className="text-xs text-[#E8A83E]">
                {data.measurement.label}: {data.measurement.message || 'Could not verify yet'}
              </p>
            </div>
          )}
          {data.issues.length === 0 ? (
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-[#3DDC84] text-xs">✓</span>
              <span className="text-sm text-[#8B8A85]">
                {data.measurement?.status === 'measured'
                  ? `All ${data.totalChecks} checks passed`
                  : 'No confirmed issues in this category yet'}
              </span>
            </div>
          ) : (
            <>
              {data.issues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => scrollToIssue(issue.id)}
                  className="w-full text-left px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ borderLeft: `2px solid ${SEVERITY_COLORS[issue.severity] || '#8B8A85'}` }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.08em]"
                      style={{ color: SEVERITY_COLORS[issue.severity] || '#8B8A85' }}
                    >
                      {issue.severity}
                    </span>
                    {issue.confidence && (
                      <span className="text-[10px] font-mono text-[#5A5955] uppercase tracking-[0.08em]">
                        · {issue.confidence}
                      </span>
                    )}
                    {issue.value !== undefined && (
                      <span className="text-[10px] font-mono text-[#8B8A85]">· {issue.value}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#F1F0EE]">{issue.title}</p>
                  {issue.plainEnglish && (
                    <p className="text-xs text-[#5A5955] mt-1 leading-relaxed">{issue.plainEnglish}</p>
                  )}
                </button>
              ))}

              {/* Passed checks — collapsed by default */}
              {data.measurement?.status === 'measured' && passedChecks.length > 0 && (
                <div className="border-t border-white/[0.04]">
                  <button
                    onClick={() => setPassedOpen(o => !o)}
                    className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <span className="text-[#3DDC84] text-[11px]">✓</span>
                    <span className="text-xs text-[#5A5955] flex-1 text-left">
                      {passedChecks.length} checks passed
                    </span>
                    <ChevronDown
                      className="w-3 h-3 text-[#5A5955] transition-transform duration-200"
                      style={{ transform: passedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>
                  {passedOpen && (
                    <div className="px-4 pb-3 space-y-1.5">
                      {passedChecks.map(check => (
                        <div key={check.id} className="flex items-start gap-2">
                          <span className="text-[#3DDC84] text-[10px] mt-0.5 shrink-0">✓</span>
                          <span className="text-xs text-[#5A5955]">{check.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
