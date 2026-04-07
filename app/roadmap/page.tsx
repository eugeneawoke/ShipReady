import Link from 'next/link'
import type { Metadata } from 'next'
import { CheckCircle2, Circle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Roadmap — ShipReady',
  description: 'What has been built, what is being built, and what is coming next for ShipReady.',
}

type PhaseStatus = 'done' | 'in-progress' | 'planned'

const phases: {
  id: string
  title: string
  subtitle: string
  status: PhaseStatus
  items: string[]
}[] = [
  {
    id: '01',
    title: 'Foundation',
    subtitle: 'Core infrastructure & basic scan',
    status: 'done',
    items: [
      'Next.js 14 App Router + TypeScript strict',
      'Supabase database & authentication',
      'Basic Lighthouse scan pipeline',
      'Landing page & scan form',
      'Report page with score display',
    ],
  },
  {
    id: '02',
    title: 'Full Audit Engine',
    subtitle: '40+ checks across 5 categories',
    status: 'done',
    items: [
      'Lighthouse performance (Core Web Vitals)',
      'SEO & social meta checks (OG, Twitter, sitemap)',
      '11 security header checks + SSL validation',
      'Mobile viewport & touch target checks',
      'Scoring algorithm & category grades',
    ],
  },
  {
    id: '03',
    title: 'AI Fix Prompts',
    subtitle: 'Claude-powered issue explanations',
    status: 'done',
    items: [
      'Per-issue Cursor & Bolt prompts',
      'Plain-English explanations',
      'AI summary of the full report',
      'Copy-to-clipboard for all prompts',
    ],
  },
  {
    id: '04',
    title: 'Monetization',
    subtitle: 'Plans, payments & rate limits',
    status: 'done',
    items: [
      'Free / Pro / Agency plan structure',
      'Lemon Squeezy billing integration',
      'Magic link & Google OAuth via Supabase',
      'Rate limiting (3 scans/month on free)',
      'Webhook handler for subscription events',
    ],
  },
  {
    id: '05',
    title: 'Launch',
    subtitle: 'SEO, social & growth tools',
    status: 'done',
    items: [
      'Dynamic OG image generation',
      'Sitemap.xml + robots.txt',
      'ShipReady badge API for repos & sites',
      'Weekly re-scan cron for Pro/Agency',
      'EN/RU internationalization',
    ],
  },
  {
    id: '06',
    title: 'Agency Plan',
    subtitle: 'Multi-domain & white-label',
    status: 'in-progress',
    items: [
      'Multi-domain dashboard (up to 10)',
      'White-label PDF export',
      'Priority support queue',
      'API access for programmatic scans',
      'Bulk scan scheduling',
    ],
  },
  {
    id: '07',
    title: 'Developer Integrations',
    subtitle: 'CI/CD & collaboration tools',
    status: 'planned',
    items: [
      'GitHub Action — block PRs on score drop',
      'Slack & Discord notifications',
      'Vercel deploy hook integration',
      'Shareable report links with comments',
    ],
  },
  {
    id: '08',
    title: 'Advanced Checks',
    subtitle: 'Deeper quality signals',
    status: 'planned',
    items: [
      'Accessibility audit (WCAG 2.1 AA)',
      'Broken link checker',
      'Cookie consent & GDPR compliance',
      'Multi-page crawl mode',
      'Performance regression tracking',
    ],
  },
]

const STATUS_META: Record<PhaseStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
  done:        { label: 'Done',        color: '#3DDC84', Icon: CheckCircle2 },
  'in-progress': { label: 'In progress', color: '#F5C518', Icon: Clock },
  planned:     { label: 'Planned',     color: '#5A5955', Icon: Circle },
}

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* nav */}
      <nav className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight hover:text-[#8B8A85] transition-colors">
            ← ShipReady
          </Link>
          <div className="flex items-center gap-4 text-xs text-[#5A5955]">
            {(['done', 'in-progress', 'planned'] as PhaseStatus[]).map(s => {
              const { label, color, Icon } = STATUS_META[s]
              return (
                <span key={s} className="flex items-center gap-1.5">
                  <Icon className="w-3 h-3" style={{ color }} />
                  {label}
                </span>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-14">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">Roadmap</p>
          <h1 className="text-[36px] font-medium tracking-tight mb-3">Where we&apos;re going</h1>
          <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg">
            ShipReady is being built in the open. Here&apos;s what&apos;s shipped, what&apos;s in progress, and what&apos;s coming next.
            Have a feature request? <a href="mailto:hi@shipready.app" className="text-[#6E56CF] hover:underline">Email us</a>.
          </p>
        </div>

        <div className="relative">
          {/* vertical timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-[#6E56CF]/40 via-white/[0.06] to-transparent" />

          <div className="space-y-8">
            {phases.map(phase => {
              const { color, Icon } = STATUS_META[phase.status]
              return (
                <div key={phase.id} className="flex gap-6">
                  {/* dot */}
                  <div className="shrink-0 mt-1">
                    <Icon className="w-[38px] h-[38px] p-2 rounded-full bg-[#161618] border border-white/[0.06]" style={{ color }} />
                  </div>

                  {/* card */}
                  <div className={`flex-1 p-5 rounded-2xl border ${
                    phase.status === 'in-progress'
                      ? 'bg-[#6E56CF]/[0.04] border-[#6E56CF]/30'
                      : 'bg-[#161618] border-white/[0.06]'
                  }`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#5A5955] tracking-widest">{phase.id}</span>
                          {phase.status === 'in-progress' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C518]/10 text-[#F5C518] font-mono border border-[#F5C518]/20">
                              In progress
                            </span>
                          )}
                        </div>
                        <h2 className="font-medium text-base">{phase.title}</h2>
                        <p className="text-xs text-[#5A5955] mt-0.5">{phase.subtitle}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {phase.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-[#8B8A85]">
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0 mt-0.5"
                            style={{ color: phase.status === 'done' ? '#3DDC84' : phase.status === 'in-progress' ? '#F5C518' : '#3A3A3A' }}
                          />
                          <span className={phase.status === 'planned' ? 'opacity-50' : ''}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-14 p-6 rounded-2xl bg-[#161618] border border-white/[0.06] text-center">
          <p className="text-sm text-[#8B8A85] mb-4">
            Have an idea or need a specific feature? We&apos;d love to hear from you.
          </p>
          <a
            href="mailto:hi@shipready.app"
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            Send a feature request
          </a>
        </div>
      </main>

      <footer className="border-t border-white/[0.06] py-6 px-6 text-center">
        <p className="text-xs text-[#5A5955]">
          © 2025 ShipReady ·{' '}
          <Link href="/privacy" className="hover:text-[#8B8A85] transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="hover:text-[#8B8A85] transition-colors">Terms</Link>
        </p>
      </footer>
    </div>
  )
}
