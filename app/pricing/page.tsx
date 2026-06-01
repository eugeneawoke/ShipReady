import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { ScrollAnchorButton } from '@/components/ui/scroll-anchor-button'
import { PricingCtas } from '@/components/pricing/PricingCtas'
import { ChecksAccordion } from '@/components/pricing/ChecksAccordion'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'
import { FeatureCell } from '@/components/shared/FeatureCell'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')
  return {
    title: t('pricingTitle'),
    description: t('pricingDescription'),
    alternates: { canonical: `${appUrl}/pricing` },
    openGraph: { url: `${appUrl}/pricing` },
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

const Cell = FeatureCell

// ─── page ─────────────────────────────────────────────────────────────────────

export default async function PricingPage() {
  const locale = await getLocale()
  const [tp, tnav, tpricing, tcta] = await Promise.all([
    getTranslations('Pricing'),
    getTranslations('Landing.nav'),
    getTranslations('Landing.pricing'),
    getTranslations('Landing.cta'),
  ])

  type Plan = { name: string; nameKey: string; price: string; period: string | null; desc: string; features: string[]; cta: string; highlight: boolean; coming: boolean }
  const plans = tpricing.raw('plans') as Plan[]

  type FaqItem = { q: string; a: string }
  const faqItems = tp.raw('faq.items') as FaqItem[]

  const r = tp.raw('rows') as Record<string, string>
  const c = tp.raw('cells') as Record<string, string>
  const n = tp.raw('notes') as Record<string, string>
  const s = tp.raw('sections') as Record<string, string>
  const col = tp.raw('cols') as Record<string, string>

  const TABLE: TableSection[] = [
    {
      heading: s.planLimits,
      rows: [
        { label: r.scansMonth,      free: '3',      pro: c.unlimited,    agency: c.unlimited,  },
        { label: r.pagesPerScan,    free: '1',      pro: '5',            agency: '10' },
        { label: r.monitoredDomains,free: false,    pro: '1',            agency: c.upTo10 },
      ],
    },
    {
      heading: s.reports,
      rows: [
        { label: r.allCategoryScores,  free: true,       pro: true,   agency: true },
        { label: r.issueDescriptions,  free: true,       pro: true,   agency: true },
        { label: r.issueChecklist,     free: true,       pro: true,   agency: true },
        { label: r.aiFixPrompts,       free: c.blurred,  pro: true,   agency: true },
        { label: r.pdfExport,          free: false,      pro: true,   agency: true },
        { label: r.whiteLabelPdf,      free: false,      pro: false,  agency: true },
      ],
    },
    {
      heading: s.monitoring,
      rows: [
        { label: r.weeklyRescan,   free: false, pro: true, agency: true },
        { label: r.weeklyDigest,   free: false, pro: true, agency: true },
        { label: r.emailAlerts,    free: false, pro: true, agency: true },
      ],
    },
    {
      heading: s.performance,
      rows: [
        { label: r.lighthouseAudit,   free: true, pro: true, agency: true },
        { label: r.lcpClsInpFcp,      free: true, pro: true, agency: true },
        { label: r.performanceScore,  free: true, pro: true, agency: true },
        { label: r.accessibilityScore,free: true, pro: true, agency: true },
      ],
    },
    {
      heading: s.seo,
      rows: [
        { label: r.titleMeta,       free: true, pro: true, agency: true },
        { label: r.canonicalUrl,    free: true, pro: true, agency: true },
        { label: r.ogSocialTags,    free: true, pro: true, agency: true },
        { label: r.twitterCard,     free: true, pro: true, agency: true },
        { label: r.sitemapXml,      free: true, pro: true, agency: true },
        { label: r.robotsTxt,       free: true, pro: true, agency: true },
        { label: r.structuredData,  free: true, pro: true, agency: true },
        { label: r.noindexDetection,free: true, pro: true, agency: true },
        { label: r.imagesAltText,   free: true, pro: true, agency: true },
      ],
    },
    {
      heading: s.security,
      rows: [
        { label: r.httpsEnforced,       free: true, pro: true, agency: true },
        { label: r.hstsHeader,          free: true, pro: true, agency: true },
        { label: r.csp,                 free: true, pro: true, agency: true },
        { label: r.xFrameOptions,       free: true, pro: true, agency: true },
        { label: r.xContentTypeOptions, free: true, pro: true, agency: true },
        { label: r.referrerPolicy,      free: true, pro: true, agency: true },
        { label: r.sslCert,             free: true, pro: true, agency: true },
        { label: r.exposedEnv,          free: true, pro: true, agency: true },
        { label: r.trackerAudit,        free: true, pro: true, agency: true },
      ],
    },
    {
      heading: s.mobile,
      rows: [
        { label: r.viewportMeta,   free: true, pro: true, agency: true },
        { label: r.favicon,        free: true, pro: true, agency: true },
        { label: r.appleTouchIcon, free: true, pro: true, agency: true },
        { label: r.webManifest,    free: true, pro: true, agency: true },
        { label: r.phoneClickable, free: true, pro: true, agency: true },
      ],
    },
    {
      heading: s.aiVisibility,
      rows: [
        { label: r.schemaOrg,       free: true, pro: true, agency: true },
        { label: r.llmsTxt,         free: true, pro: true, agency: true },
        { label: r.aiCrawlerAccess, free: true, pro: true, agency: true },
        { label: r.faqSchema,       free: true, pro: true, agency: true },
        { label: r.authorEntity,    free: true, pro: true, agency: true },
        { label: r.headingHierarchy,free: true, pro: true, agency: true },
        { label: r.thinContent,     free: true, pro: true, agency: true },
      ],
    },
    {
      heading: s.apiTeam,
      rows: [
        { label: r.mcpServer,      free: false, pro: false, agency: true },
        { label: r.restApi,        free: false, pro: false, agency: true,      note: n.apiEndpoints },
        { label: r.bulkScanApi,    free: false, pro: false, agency: true,      note: n.bulkUrls },
        { label: r.teamSeats,      free: false, pro: false, agency: c.upTo5,   note: n.inviteEmail },
        { label: r.prioritySupport,free: false, pro: false, agency: true },
      ],
    },
  ]

  let user = null
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    user = data.user
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">

      <SiteHeader
        sticky
        mobileNavItems={[
          { label: tnav('howItWorks'), href: '/#how-it-works' },
          { label: tnav('pricing'), href: '/pricing' },
          { label: tnav('roadmap'), href: '/roadmap' },
          { label: tnav('methodology'), href: '/methodology' },
        ]}
        mobileActions={
          user ? (
            <Link href="/dashboard" className="flex min-h-11 items-center justify-center rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C68D4]">
              {tnav('dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/auth/login?mode=signup" className="flex min-h-11 items-center justify-center rounded-lg bg-[#6E56CF] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C68D4]">
                {tnav('getStarted')}
              </Link>
              <Link href="/auth/login" className="flex min-h-11 items-center justify-center rounded-lg border border-white/[0.08] px-4 py-2 text-sm text-[#F1F0EE] transition-colors hover:bg-white/[0.04]">
                {tnav('signIn')}
              </Link>
            </>
          )
        }
        right={
          user ? (
            <Link href="/dashboard" className="hidden text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium md:inline-flex">
              {tnav('dashboard')}
            </Link>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/auth/login" className="text-sm px-4 py-1.5 rounded-lg border border-white/[0.08] text-[#F1F0EE] hover:bg-[#161618] transition-colors">
                {tnav('signIn')}
              </Link>
              <Link href="/auth/login?mode=signup" className="text-sm px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium">
                {tnav('getStarted')}
              </Link>
            </div>
          )
        }
      >
        <nav className="hidden md:flex items-center gap-5 text-sm text-[#8B8A85]">
          <Link href="/#how-it-works" className="hover:text-[#F1F0EE] transition-colors">{tnav('howItWorks')}</Link>
          <Link href="/pricing" className="text-[#F1F0EE] font-medium">{tnav('pricing')}</Link>
          <Link href="/roadmap" className="hover:text-[#F1F0EE] transition-colors">{tnav('roadmap')}</Link>
        </nav>
      </SiteHeader>

      <main className="max-w-5xl mx-auto px-6 py-16">

        {/* hero */}
        <div className="text-center mb-14">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono mb-3">{tpricing('eyebrow')}</p>
          <h1 className="text-3xl sm:text-[40px] font-semibold tracking-[-0.03em] mb-3">{tpricing('title')}</h1>
          <p className="text-[#8B8A85] text-sm max-w-sm mx-auto leading-relaxed">{tpricing('sub')}</p>
        </div>

        {/* plan strip */}
        <div className="mb-8">
          <PricingCtas
            isLoggedIn={!!user}
            plans={plans}
            popularLabel={tpricing('popular')}
            comingSoonLabel={tpricing('comingSoon')}
            cancelLabel={tpricing('cancelAnytime')}
            toggleMonthly={tpricing('toggleMonthly')}
            toggleYearly={tpricing('toggleYearly')}
            proYearlyPrice={tpricing('proYearlyPrice')}
            proYearlySavings={tpricing('proYearlySavings')}
          />
        </div>

        {/* scroll invitation */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px flex-1 bg-white/[0.05]" />
          <ScrollAnchorButton
            targetId="comparison"
            className="px-5 py-2 rounded-full border border-cyan-500/25 text-[11px] font-mono uppercase tracking-[0.14em] text-cyan-400/80 hover:text-cyan-300 hover:border-cyan-400/40 transition-colors cursor-pointer whitespace-nowrap"
          >
            {tp('tableHeading')} ↓
          </ScrollAnchorButton>
          <div className="h-px flex-1 bg-white/[0.05]" />
        </div>

        {/* comparison table */}
        <div id="comparison" className="mb-20 scroll-mt-24">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-6 text-center">
            {tp('tableHeading')}
          </h2>

          <div className="overflow-x-auto scrollbar-hide">
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden min-w-[520px]">
            <div className="grid grid-cols-[1fr_88px_88px_88px] bg-[#161618] border-b border-white/[0.08] px-5 py-3">
              <div />
              <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">{col.free}</div>
              <div className="text-center text-[11px] text-[#a78bfa] uppercase tracking-[0.12em] font-mono">{col.pro}</div>
              <div className="text-center text-[11px] text-[#5A5955] uppercase tracking-[0.12em] font-mono">{col.agency}</div>
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
        </div>

        {/* checks accordion */}
        <div className="mb-20">
          <ChecksAccordion locale={locale} />
        </div>

        {/* faq */}
        <div className="mb-20 max-w-2xl mx-auto">
          <h2 className="text-[11px] font-mono uppercase tracking-[0.14em] text-[#5A5955] mb-6 text-center">
            {tp('faq.heading')}
          </h2>
          <div className="space-y-3">
            {faqItems.map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl bg-[#161618] border border-white/[0.06]">
                <p className="text-sm font-medium text-[#F1F0EE] mb-1.5">{q}</p>
                <p className="text-sm text-[#8B8A85] leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* cta */}
        <div className="rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 p-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight mb-2">{tcta('title')}</h2>
          <p className="text-[#8B8A85] text-sm mb-6">{tp('cta.sub')}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-6 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            {tp('cta.btn')} →
          </Link>
        </div>

      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
