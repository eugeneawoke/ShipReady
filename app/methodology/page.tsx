import Link from 'next/link'
import type { Metadata } from 'next'
import { getLocale } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export const metadata: Metadata = {
  title: 'Methodology — ShipReady',
  description: 'How ShipReady checks your site: 5 categories, evidence-based confidence model, and honest measurement states.',
}

const CATEGORIES = [
  {
    icon: '⚡',
    color: '#F5C518',
    name: 'Performance',
    desc: 'A real Lighthouse mobile run inside a headless Chromium browser on Railway. We measure Core Web Vitals (LCP, CLS, INP, FCP), composite performance score, and accessibility score. No synthetic shortcuts — the same engine Google uses.',
  },
  {
    icon: '🔍',
    color: '#4A9EFF',
    name: 'SEO & Social',
    desc: 'Complete meta audit: title and description length, Open Graph image and tags, Twitter/X card, canonical URL, robots.txt directives, sitemap presence, and Schema.org structured data. Covers what search engines and social platforms read before your content.',
  },
  {
    icon: '🛡️',
    color: '#FF4444',
    name: 'Security',
    desc: '10 security checks including HTTPS enforcement, Content-Security-Policy, HSTS, X-Frame-Options, X-Content-Type-Options, SSL/TLS certificate validity, exposed .env files, and API key patterns in HTML. Surfaces the headers and files attackers look for first.',
  },
  {
    icon: '📱',
    color: '#3DDC84',
    name: 'Mobile',
    desc: 'Viewport meta tag configuration, favicon presence (for browser tabs), and Apple touch icon (for iOS home screen). These three checks determine whether your site renders and identifies correctly across every device.',
  },
  {
    icon: '🤖',
    color: '#A78BFA',
    name: 'AI Visibility',
    desc: 'GEO + AEO audit: checks whether ChatGPT, Claude, Perplexity, and Google AI Overview can find, parse, and cite your site. Covers llms.txt and ai.txt, AI crawler permissions in robots.txt, Schema.org JSON-LD entity signals, FAQ markup, answer-first content structure, date freshness, and organization entity clarity.',
  },
]

const CONFIDENCE_LEVELS = [
  {
    label: 'Verified',
    color: '#3DDC84',
    bg: 'rgba(61,220,132,0.08)',
    border: 'rgba(61,220,132,0.2)',
    desc: 'Confirmed by direct measurement or HTTP response. This finding is a fact. Verified issues are score-eligible.',
  },
  {
    label: 'Likely',
    color: '#F5C518',
    bg: 'rgba(245,197,24,0.08)',
    border: 'rgba(245,197,24,0.2)',
    desc: 'Strongly indicated by evidence but not directly confirmed. Shown so you can investigate — not counted in your score.',
  },
  {
    label: 'Heuristic',
    color: '#8B8A85',
    bg: 'rgba(139,138,133,0.08)',
    border: 'rgba(139,138,133,0.2)',
    desc: 'Pattern-based observation. May or may not apply to your specific setup. Useful context, not a hard verdict.',
  },
]

const MEASUREMENT_STATES = [
  {
    label: 'Measured',
    color: '#3DDC84',
    desc: 'The check ran and produced a result. You can trust this finding.',
  },
  {
    label: 'Partial',
    color: '#F5C518',
    desc: 'The check ran but some data was unavailable (e.g. Lighthouse timed out on a slow server). Result is shown but flagged.',
  },
  {
    label: 'Unavailable',
    color: '#5A5955',
    desc: 'The check could not run — network block, timeout, or scanner limitation. We show this explicitly. A failed measurement never appears as a pass.',
  },
]

export default async function MethodologyPage() {
  const locale = await getLocale()
  const backLabel = locale === 'ru' ? 'На главную' : 'Back to home'

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader sticky />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE]">
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 mb-4 text-[11px] font-mono uppercase tracking-[0.15em] text-[#6E56CF]">
            Methodology
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] leading-[1.05] mb-4">
            How ShipReady checks your site
          </h1>
          <p className="text-[#8B8A85] leading-relaxed text-base max-w-2xl">
            Every finding is backed by evidence. We tell you what we measured, what we inferred, and what we couldn&apos;t reach — because a failed check should never look like a pass.
          </p>
        </div>

        {/* 5 Categories */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">5 categories, 35+ checks</h2>
          <div className="space-y-4">
            {CATEGORIES.map(cat => (
              <div
                key={cat.name}
                className="rounded-2xl border border-white/[0.06] bg-[#161618] p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xl">{cat.icon}</span>
                  <h3 className="font-semibold tracking-tight" style={{ color: cat.color }}>{cat.name}</h3>
                </div>
                <p className="text-sm text-[#8B8A85] leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Confidence model */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">Confidence model</h2>
          <p className="text-sm text-[#8B8A85] mb-6 leading-relaxed">
            Not every finding can be confirmed with equal certainty. ShipReady labels every issue so you know how much weight to give it.
          </p>
          <div className="space-y-3">
            {CONFIDENCE_LEVELS.map(level => (
              <div
                key={level.label}
                className="rounded-xl p-4 flex items-start gap-4"
                style={{ background: level.bg, border: `1px solid ${level.border}` }}
              >
                <span
                  className="shrink-0 mt-0.5 text-[11px] font-mono px-2 py-0.5 rounded-full font-medium"
                  style={{ color: level.color, background: `${level.color}18`, border: `1px solid ${level.color}30` }}
                >
                  {level.label}
                </span>
                <p className="text-sm text-[#8B8A85] leading-relaxed">{level.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scoring */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">How scoring works</h2>
          <p className="text-sm text-[#8B8A85] leading-relaxed mb-4">
            The overall score (0–100) reflects only <strong className="text-[#F1F0EE]">verified, score-eligible</strong> findings. Likely and heuristic issues are shown for context but do not silently penalise your score.
          </p>
          <div className="rounded-2xl border border-white/[0.06] bg-[#161618] p-6 space-y-3 text-sm text-[#8B8A85] leading-relaxed">
            <p>Each verified issue carries a severity weight (critical, high, medium, low). The score starts at 100 and deductions are applied per issue. Category scores follow the same logic within their domain.</p>
            <p>A score of 70+ is considered <span className="text-[#7BC67E]">Good</span>. 50–69 is <span className="text-[#F5C518]">Needs work</span>. Below 50 is <span className="text-[#FF4444]">Critical</span>.</p>
          </div>
        </section>

        {/* Measurement states */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">Measurement states</h2>
          <p className="text-sm text-[#8B8A85] mb-6 leading-relaxed">
            Heavy checks (Lighthouse, SSL, DNS) may not complete for every site. We surface the state so you always know what was actually measured.
          </p>
          <div className="space-y-3">
            {MEASUREMENT_STATES.map(state => (
              <div
                key={state.label}
                className="rounded-xl border border-white/[0.06] bg-[#161618] p-4 flex items-start gap-4"
              >
                <span
                  className="shrink-0 mt-0.5 w-2 h-2 rounded-full mt-1.5"
                  style={{ background: state.color }}
                />
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: state.color }}>{state.label}</p>
                  <p className="text-sm text-[#8B8A85] leading-relaxed">{state.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="pt-4 border-t border-white/[0.06] text-sm text-[#5A5955]">
          Have a question about a specific check?{' '}
          <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">
            Ask on Telegram
          </a>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter />
    </div>
  )
}
