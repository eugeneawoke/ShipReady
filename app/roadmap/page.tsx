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
    subtitle: 'Core product foundation is live',
    status: 'done',
    items: [
      'Next.js 16 App Router + TypeScript strict',
      'Supabase database, auth, and report storage',
      'Railway scanner + Vercel app split',
      'Landing page, dashboard, and report page',
      'Basic scan dispatch and polling flow',
    ],
  },
  {
    id: '02',
    title: 'Audit Engine',
    subtitle: 'Core scan engine is shipped, accuracy hardening continues',
    status: 'done',
    items: [
      'Performance, SEO, security, mobile, and AI visibility categories',
      'Lighthouse mobile metrics plus deterministic HTML and header checks',
      'Broken link and AI visibility heuristics are already in the report',
      'Phased scan flow with truthful scoring and measurement states',
      'Accessibility, multi-page crawl, and deeper regression checks are next',
    ],
  },
  {
    id: '03',
    title: 'Report Experience',
    subtitle: 'Report UI, sharing, prompts, and PDF export are shipped',
    status: 'done',
    items: [
      'Score ring, category breakdowns, and issue evidence in the report UI',
      'Plain-English explanations and AI-generated summary',
      'Prompt surfaces for code-aware and vibe tools',
      'PDF export, share feedback, and download feedback in report header',
      'Per-issue prompt quality and wow-insight depth continue to improve',
    ],
  },
  {
    id: '04',
    title: 'Accounts & Billing',
    subtitle: 'Accounts are live, billing is only partially wired',
    status: 'in-progress',
    items: [
      'Free / Pro / Agency plan structure',
      'Email/password auth and Google OAuth via Supabase',
      'Monthly free scan limit and paywalled report actions',
      'Payment provider is TBD; paid access can be enabled manually during beta',
      'Billing products, checkout setup, and live payment activation are not finished yet',
      'Manual private-beta access is easier than a full paid launch today',
    ],
  },
  {
    id: '05',
    title: 'Monitoring & Automation',
    subtitle: 'Practically ready — final production alert setup and end-to-end testing remain',
    status: 'in-progress',
    items: [
      'Dynamic OG image generation',
      'Sitemap.xml + robots.txt',
      'Weekly monitoring toggle per domain in the dashboard',
      'Monday cron re-scan for monitored domains',
      'Monitoring baseline and diff logic in the data model',
      'Email alert pipeline is implemented; sender-domain setup and final live verification remain',
    ],
  },
  {
    id: '06',
    title: 'Launch Readiness',
    subtitle: 'The next milestone is a stable first-user launch',
    status: 'in-progress',
    items: [
      'Custom production domain and polished onboarding flow',
      'Runtime monitoring, logs, and production alerts',
      'Scanner SSRF protection in code is shipped; outbound firewall/proxy hardening is planned after demand validation',
      'Billing activation or a deliberate private-beta access path',
      'Support and feedback loop for the first users',
      'Tightening the highest-risk report inaccuracies before launch',
    ],
  },
  {
    id: '07',
    title: 'Agency & Team Workflows',
    subtitle: 'Higher-tier operations after first-user launch',
    status: 'planned',
    items: [
      'Multi-domain dashboard (up to 10)',
      'Team seats and support workflow',
      'API access for programmatic scans',
      'Bulk scan scheduling',
    ],
  },
  {
    id: '08',
    title: 'Integrations & Deeper Checks',
    subtitle: 'Developer workflows and deeper product depth',
    status: 'planned',
    items: [
      'GitHub Action — block PRs on score drop',
      'Slack & Discord notifications',
      'Vercel deploy hook integration',
      'Shareable report links with comments',
      'Accessibility audit (WCAG 2.1 AA)',
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
            ShipReady is being built in the open. This roadmap shows what is already shipped, what is almost launch-ready,
            and what comes next after the first users are onboard.
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
