import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteMicroFooter } from '@/components/SiteMicroFooter'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  return {
    title: t('pricingTitle'),
    description: t('pricingDescription'),
  }
}

// ─── types ────────────────────────────────────────────────────────────────────

type CellValue = true | false | string

interface TableRow {
  label: string
  free: CellValue
  pro: CellValue
  agency: CellValue
  note?: string
}

interface TableSection {
  heading: string
  rows: TableRow[]
}

// ─── full feature comparison data ────────────────────────────────────────────

const TABLE: TableSection[] = [
  {
    heading: 'Plan limits',
    rows: [
      { label: 'Scans / month',               free: '3',        pro: 'Unlimited', agency: 'Unlimited' },
      { label: 'Pages per scan (crawl)',       free: '1',        pro: '5',         agency: '10' },
      { label: 'Monitored domains',            free: false,      pro: '1',         agency: 'Up to 10' },
    ],
  },
  {
    heading: 'Reports & export',
    rows: [
      { label: 'All category scores',          free: true,       pro: true,        agency: true },
      { label: 'Issue descriptions',           free: true,       pro: true,        agency: true },
      { label: 'AI fix prompts',               free: 'Blurred',  pro: true,        agency: true },
      { label: 'PDF export',                   free: false,      pro: true,        agency: true },
      { label: 'White-label PDF',              free: false,      pro: false,       agency: true },
    ],
  },
  {
    heading: 'Monitoring & alerts',
    rows: [
      { label: 'Weekly re-scan',               free: false,      pro: true,        agency: true },
      { label: 'Email alerts on regression',   free: false,      pro: true,        agency: true },
    ],
  },
  {
    heading: 'Performance checks',
    rows: [
      { label: 'Real Lighthouse mobile audit', free: true,       pro: true,        agency: true },
      { label: 'LCP · CLS · INP · FCP',       free: true,       pro: true,        agency: true },
      { label: 'Performance score',            free: true,       pro: true,        agency: true },
      { label: 'Accessibility score',          free: true,       pro: true,        agency: true },
    ],
  },
  {
    heading: 'SEO checks',
    rows: [
      { label: 'Title & meta description',     free: true,       pro: true,        agency: true },
      { label: 'Canonical URL',                free: true,       pro: true,        agency: true },
      { label: 'Open Graph / Social tags',     free: true,       pro: true,        agency: true },
      { label: 'Twitter / X card',             free: true,       pro: true,        agency: true },
      { label: 'Sitemap.xml',                  free: true,       pro: true,        agency: true },
      { label: 'robots.txt',                   free: true,       pro: true,        agency: true },
      { label: 'Structured data (JSON-LD)',    free: true,       pro: true,        agency: true },
      { label: 'Noindex detection',            free: true,       pro: true,        agency: true },
      { label: 'Images alt text audit',        free: true,       pro: true,        agency: true },
    ],
  },
  {
    heading: 'Security checks',
    rows: [
      { label: 'HTTPS enforced',               free: true,       pro: true,        agency: true },
      { label: 'HSTS header',                  free: true,       pro: true,        agency: true },
      { label: 'Content-Security-Policy',      free: true,       pro: true,        agency: true },
      { label: 'X-Frame-Options',              free: true,       pro: true,        agency: true },
      { label: 'X-Content-Type-Options',       free: true,       pro: true,        agency: true },
      { label: 'Referrer-Policy',              free: true,       pro: true,        agency: true },
      { label: 'SSL / TLS certificate',        free: true,       pro: true,        agency: true },
      { label: 'Exposed .env detection',       free: true,       pro: true,        agency: true },
      { label: 'Third-party tracker audit',    free: true,       pro: true,        agency: true },
    ],
  },
  {
    heading: 'Mobile checks',
    rows: [
      { label: 'Viewport meta tag',            free: true,       pro: true,        agency: true },
      { label: 'Favicon',                      free: true,       pro: true,        agency: true },
      { label: 'Apple touch icon',             free: true,       pro: true,        agency: true },
      { label: 'Web app manifest',             free: true,       pro: true,        agency: true },
      { label: 'Phone numbers clickable',      free: true,       pro: true,        agency: true },
    ],
  },
  {
    heading: 'AI visibility checks',
    rows: [
      { label: 'Schema.org JSON-LD',           free: true,       pro: true,        agency: true },
      { label: 'llms.txt',                     free: true,       pro: true,        agency: true },
      { label: 'AI crawler access (robots)',   free: true,       pro: true,        agency: true },
      { label: 'FAQ schema',                   free: true,       pro: true,        agency: true },
      { label: 'Author entity signal',         free: true,       pro: true,        agency: true },
      { label: 'Heading hierarchy',            free: true,       pro: true,        agency: true },
      { label: 'Thin content detection',       free: true,       pro: true,        agency: true },
    ],
  },
  {
    heading: 'API & team',
    rows: [
      { label: 'REST API v1',                  free: false,      pro: false,       agency: true,      note: 'scan, status, issues endpoints' },
      { label: 'Bulk scan API',                free: false,      pro: false,       agency: true,      note: 'up to 10 URLs per call' },
      { label: 'Team seats',                   free: false,      pro: false,       agency: 'Up to 5', note: 'invite by email' },
      { label: 'Priority support',             free: false,      pro: false,       agency: true },
    ],
  },
]

// ─── cell ─────────────────────────────────────────────────────────────────────

function Cell({ value, highlight }: { value: CellValue; highlight?: boolean }) {
  if (value === true) {
    return (
      <span className="flex items-center justify-center">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#3DDC84" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-label="Included">
          <circle cx="12" cy="12" r="10" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
    )
  }
  if (value === false) {
    return <span className="flex items-center justify-center text-[#2E2E32]">—</span>
  }
  return (
    <span className={`text-[11px] font-mono text-center block leading-tight ${highlight ? 'text-[#a78bfa]' : 'text-[#8B8A85]'}`}>
      {value}
    </span>
  )
}

// ─── plan card ────────────────────────────────────────────────────────────────

interface PlanCardProps {
  tag: string
  price: string
  period: string | null
  desc: string
  cta: string
  ctaHref: string
  highlight?: boolean
  comingSoon?: boolean
}

function PlanCard({ tag, price, period, desc, cta, ctaHref, highlight, comingSoon }: PlanCardProps) {
  return (
    <div className={`relative flex flex-col p-6 rounded-2xl border transition-colors ${
      comingSoon
        ? 'bg-[#161618] border-white/[0.04] opacity-60'
        : highlight
        ? 'bg-[#6E56CF]/[0.06] border-[#6E56CF] shadow-[0_0_60px_rgba(110,86,207,0.12)]'
        : 'bg-[#161618] border-white/[0.06] hover:border-white/[0.14]'
    }`}>
      {highlight && !comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
          Most popular
        </div>
      )}
      {comingSoon && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#232328] text-[#8B8A85] border border-white/[0.10] px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
          Coming soon
        </div>
      )}

      <p className="text-[10px] text-[#5A5955] uppercase tracking-[0.15em] font-mono mb-1">{tag}</p>
      <p className="text-sm text-[#8B8A85] mb-4">{desc}</p>

      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-[38px] font-mono font-medium leading-none">{price}</span>
        {period && <span className="text-[#8B8A85] text-sm">{period}</span>}
      </div>

      <div className="mt-auto">
        {comingSoon ? (
          <Link
            href="/roadmap"
            className="block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[#1E1E21] border border-white/[0.06] text-[#5A5955] hover:text-[#8B8A85] transition-colors"
          >
            View roadmap →
          </Link>
        ) : (
          <Link
            href={ctaHref}
            className={`block w-full py-2.5 rounded-xl text-sm font-medium text-center transition-colors ${
              highlight
                ? 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
                : 'bg-[#1E1E21] border border-white/[0.08] text-[#F1F0EE] hover:bg-[#232328]'
            }`}
          >
            {cta}
          </Link>
        )}
        {!comingSoon && period && (
          <p className="mt-2 text-center text-[11px] text-[#5A5955]">Cancel anytime</p>
        )}
      </div>
    </div>
  )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">

      <SiteHeader
        sticky
        right={
          user ? (
            <Link
              href="/dashboard"
              className="text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm px-4 py-1.5 rounded-lg border border-white/[0.08] text-[#F1F0EE] hover:bg-[#161618] transition-colors"
            >
              Sign in
            </Link>
          )
        }
      >
        <nav className="hidden md:flex items-center gap-5 text-sm text-[#8B8A85]">
          <Link href="/#how" className="hover:text-[#F1F0EE] transition-colors">How it works</Link>
          <Link href="/pricing" className="text-[#F1F0EE] font-medium">Pricing</Link>
          <Link href="/roadmap" className="hover:text-[#F1F0EE] transition-colors">Roadmap</Link>
        </nav>
      </SiteHeader>

      <main className="max-w-5xl mx-auto px-6 py-16">

        {/* hero */}
        <div className="text-center mb-14">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono mb-3">Pricing</p>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] mb-3">Simple, transparent</h1>
          <p className="text-[#8B8A85] text-sm max-w-sm mx-auto leading-relaxed">
            Start free. Upgrade when you need more scans, AI prompts, or team access.
          </p>
        </div>

        {/* plan cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-20">
          <PlanCard
            tag="FREE"
            price="$0"
            period={null}
            desc="Try it out"
            cta="Start free"
            ctaHref="/"
          />
          <PlanCard
            tag="PRO"
            price="$14"
            period="/mo"
            desc="For solo founders"
            cta="Get Pro"
            ctaHref="/auth/login"
            highlight
          />
          <PlanCard
            tag="AGENCY"
            price="$39"
            period="/mo"
            desc="For teams auditing client sites"
            cta="Get Agency"
            ctaHref="/auth/login"
            comingSoon
          />
        </div>

        {/* comparison table */}
        <div className="mb-20">
          <h2 className="text-base font-medium tracking-tight mb-6 text-center text-[#8B8A85] uppercase tracking-[0.1em] text-[11px] font-mono">
            Full feature comparison
          </h2>

          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            {/* sticky column header */}
            <div className="grid grid-cols-[1fr_88px_88px_88px] bg-[#161618] border-b border-white/[0.08] px-5 py-3">
              <div />
              <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">Free</div>
              <div className="text-center text-[11px] text-[#a78bfa] uppercase tracking-[0.12em] font-mono">Pro</div>
              <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">Agency</div>
            </div>

            {TABLE.map((section, si) => (
              <div key={section.heading}>
                <div className="grid grid-cols-[1fr_88px_88px_88px] bg-[#111113] border-b border-white/[0.04] px-5 py-2">
                  <span className="text-[10px] text-[#5A5955] uppercase tracking-[0.14em] font-mono col-span-4">
                    {section.heading}
                  </span>
                </div>

                {section.rows.map((row, ri) => {
                  const isLast = si === TABLE.length - 1 && ri === section.rows.length - 1
                  return (
                    <div
                      key={row.label}
                      className={`grid grid-cols-[1fr_88px_88px_88px] px-5 py-3 items-center ${
                        !isLast ? 'border-b border-white/[0.04]' : ''
                      } ${ri % 2 === 0 ? 'bg-[#0E0E0F]' : 'bg-[#111113]'}`}
                    >
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="text-sm text-[#C9C8C3] leading-snug">{row.label}</span>
                        {row.note && (
                          <span className="text-[11px] text-[#3A3A3A] shrink-0 hidden md:inline">{row.note}</span>
                        )}
                      </div>
                      <Cell value={row.free} />
                      <Cell value={row.pro} highlight />
                      <Cell value={row.agency} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* faq */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-6 text-center">
            Common questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'Does the free plan require a credit card?',
                a: 'No. The free plan requires no credit card. Sign up with email or Google and run your first scan immediately.',
              },
              {
                q: 'What counts as a "scan"?',
                a: 'Each submitted URL counts as one scan. Running the same URL again counts as another scan. Multi-page crawl pages within one scan do not count as separate scans.',
              },
              {
                q: 'When is Agency available?',
                a: "Agency is currently in development. Check the roadmap to see what's planned.",
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel from your dashboard at any time. Your Pro access remains until the end of the billing period.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl bg-[#161618] border border-white/[0.06]">
                <p className="text-sm font-medium text-[#F1F0EE] mb-1.5">{q}</p>
                <p className="text-sm text-[#8B8A85] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* cta */}
        <div className="rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 p-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight mb-2">Is your app ship-ready?</h2>
          <p className="text-[#8B8A85] text-sm mb-6">Run a free scan — no signup required for the first scan.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            Start free scan →
          </Link>
        </div>

      </main>

      <SiteMicroFooter />
    </div>
  )
}
