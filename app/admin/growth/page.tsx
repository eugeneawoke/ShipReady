import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { getLocale, getTranslations } from 'next-intl/server'
import { SiteHeader } from '@/components/SiteHeader'
import { createClient, createServiceClient } from '@/lib/supabase'

export const metadata: Metadata = {
  title: 'Growth Admin - ShipReady',
  robots: { index: false, follow: false },
}

const RECENT_LIMIT = 1000
const CAMPAIGN_LIMIT = 100
const REFERRAL_LIMIT = 100

type GrowthVisitRow = {
  utm_source: string | null
  utm_campaign: string | null
  created_at: string
}

type GrowthEventRow = {
  event_name: string
  created_at: string
}

type CampaignRow = {
  id: string
  code: string
  name: string | null
  is_active: boolean
  grant_days: number
  max_grants: number | null
  created_at: string
}

type ReferralRow = {
  id: string
  code: string
  owner_user_id: string | null
  campaign_id: string | null
  is_active: boolean
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  created_at: string
}

type GrantRow = {
  id: string
  user_id: string | null
  campaign_id: string | null
  referral_code_id: string | null
  revoked_at: string | null
  starts_at: string
  expires_at: string | null
  created_at: string
}

type ScanRow = {
  user_id: string | null
  status: string | null
  created_at: string
}

type MonitoredDomainRow = {
  user_id: string | null
  active: boolean | null
  created_at: string
}

function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  )
}

function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value)
}

function formatPercent(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 1, style: 'percent' }).format(value)
}

function formatDate(value: string | null, locale: string, noExpiryLabel: string): string {
  if (!value) return noExpiryLabel
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
}

function emptyLabel(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback
}

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount)
}

function groupVisitsBySource(visits: GrowthVisitRow[], labels: { unknown: string; mixed: string }) {
  const rows = new Map<string, { source: string; visits: number; campaign: string }>()

  for (const visit of visits) {
    const source = emptyLabel(visit.utm_source, labels.unknown)
    const current = rows.get(source) ?? { source, visits: 0, campaign: labels.mixed }
    current.visits += 1
    if (current.campaign === labels.mixed && visit.utm_campaign) current.campaign = visit.utm_campaign
    if (current.campaign !== labels.mixed && visit.utm_campaign && current.campaign !== visit.utm_campaign) {
      current.campaign = labels.mixed
    }
    rows.set(source, current)
  }

  return Array.from(rows.values()).sort((a, b) => b.visits - a.visits)
}

function eventCounts(events: GrowthEventRow[]) {
  const counts = new Map<string, number>()
  for (const event of events) increment(counts, event.event_name)
  return counts
}

function activeGrantCount(grants: GrantRow[], now: Date): number {
  return grants.filter((grant) => {
    if (grant.revoked_at) return false
    if (new Date(grant.starts_at) > now) return false
    return !grant.expires_at || new Date(grant.expires_at) > now
  }).length
}

function countByNullableId<T extends { campaign_id?: string | null; referral_code_id?: string | null }>(
  rows: T[],
  field: 'campaign_id' | 'referral_code_id',
) {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const id = row[field]
    if (id) increment(counts, id)
  }
  return counts
}

function countDistinctGrantUsersByReferral(grants: GrantRow[]) {
  const usersByReferral = new Map<string, Set<string>>()

  for (const grant of grants) {
    if (!grant.referral_code_id || !grant.user_id) continue
    const users = usersByReferral.get(grant.referral_code_id) ?? new Set<string>()
    users.add(grant.user_id)
    usersByReferral.set(grant.referral_code_id, users)
  }

  return new Map(Array.from(usersByReferral, ([referralId, users]) => [referralId, users.size]))
}

function activationMetrics(
  events: GrowthEventRow[],
  scans: ScanRow[],
  monitoredDomains: MonitoredDomainRow[],
  labels: {
    firstCompletedScan: string
    firstCompletedScanNote: string
    secondCompletedScan: string
    secondCompletedScanNote: string
    pdfExportIntent: string
    pdfExportIntentNote: string
    monitoringEnabled: string
    monitoringEnabledNote: string
  },
) {
  const eventCountMap = eventCounts(events)
  const scansByUser = new Map<string, number>()

  for (const scan of scans) {
    if (!scan.user_id || scan.status !== 'done') continue
    increment(scansByUser, scan.user_id)
  }

  const firstScanUsers = Array.from(scansByUser.values()).filter((count) => count >= 1).length
  const secondScanUsers = Array.from(scansByUser.values()).filter((count) => count >= 2).length
  const activeMonitoringUsers = new Set(
    monitoredDomains
      .filter((domain) => domain.active && domain.user_id)
      .map((domain) => domain.user_id as string),
  ).size

  return [
    { label: labels.firstCompletedScan, value: firstScanUsers, note: labels.firstCompletedScanNote },
    { label: labels.secondCompletedScan, value: secondScanUsers, note: labels.secondCompletedScanNote },
    { label: labels.pdfExportIntent, value: eventCountMap.get('pdf_export_clicked') ?? 0, note: labels.pdfExportIntentNote },
    { label: labels.monitoringEnabled, value: activeMonitoringUsers, note: labels.monitoringEnabledNote },
  ]
}

function Card({ label, value, note, locale }: { label: string; value: number; note: string; locale: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#151517] p-5">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8B8A85]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#F1F0EE]">{formatNumber(value, locale)}</p>
      <p className="mt-2 text-sm leading-6 text-[#A7A59F]">{note}</p>
    </div>
  )
}

function StatusPill({ children }: { children: string }) {
  return (
    <span className="inline-flex rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-[#D7D4CE]">
      {children}
    </span>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/[0.08] bg-[#111113] p-4 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold tracking-tight text-[#F1F0EE]">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-[#8B8A85]">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
      <table className="min-w-full divide-y divide-white/[0.06] text-left text-sm">{children}</table>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-medium text-[#A7A59F]">{children}</th>
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-[#F1F0EE]">{children}</td>
}

export default async function AdminGrowthPage() {
  const t = await getTranslations('AdminGrowth')
  const locale = await getLocale()
  const userSupabase = await createClient()
  const {
    data: { user },
  } = await userSupabase.auth.getUser()

  if (!user?.email) redirect('/auth/login')

  const adminEmails = parseAdminEmails(process.env.ADMIN_EMAILS)
  if (!adminEmails.size || !adminEmails.has(user.email.toLowerCase())) notFound()

  const serviceSupabase = createServiceClient()
  const now = new Date()

  const [
    visitsCountResult,
    eventsCountResult,
    activeGrantsResult,
    completedScansCountResult,
    visitsResult,
    eventsResult,
    campaignsResult,
    referralsResult,
    grantsResult,
    scansResult,
    monitoredDomainsResult,
  ] = await Promise.all([
    serviceSupabase.from('growth_visits').select('id', { count: 'exact', head: true }),
    serviceSupabase.from('growth_events').select('id', { count: 'exact', head: true }),
    serviceSupabase
      .from('beta_access_grants')
      .select('id', { count: 'exact', head: true })
      .is('revoked_at', null)
      .lte('starts_at', now.toISOString())
      .or(`expires_at.is.null,expires_at.gt.${now.toISOString()}`),
    serviceSupabase.from('scans').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    serviceSupabase
      .from('growth_visits')
      .select('utm_source, utm_campaign, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    serviceSupabase
      .from('growth_events')
      .select('event_name, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    serviceSupabase
      .from('growth_campaigns')
      .select('id, code, name, is_active, grant_days, max_grants, created_at')
      .order('created_at', { ascending: false })
      .limit(CAMPAIGN_LIMIT),
    serviceSupabase
      .from('referral_codes')
      .select('id, code, owner_user_id, campaign_id, is_active, max_uses, uses_count, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(REFERRAL_LIMIT),
    serviceSupabase
      .from('beta_access_grants')
      .select('id, user_id, campaign_id, referral_code_id, revoked_at, starts_at, expires_at, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    serviceSupabase
      .from('scans')
      .select('user_id, status, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    serviceSupabase
      .from('monitored_domains')
      .select('user_id, active, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
  ])

  const visits = (visitsResult.data ?? []) as GrowthVisitRow[]
  const events = (eventsResult.data ?? []) as GrowthEventRow[]
  const campaigns = (campaignsResult.data ?? []) as CampaignRow[]
  const referrals = (referralsResult.data ?? []) as ReferralRow[]
  const grants = (grantsResult.data ?? []) as GrantRow[]
  const scans = (scansResult.data ?? []) as ScanRow[]
  const monitoredDomains = (monitoredDomainsResult.data ?? []) as MonitoredDomainRow[]
  const campaignGrantCounts = countByNullableId(grants, 'campaign_id')
  const referralActivatedCounts = countDistinctGrantUsersByReferral(grants)
  const visitSources = groupVisitsBySource(visits, { unknown: t('labels.unknown'), mixed: t('labels.mixed') })
  const activationRows = activationMetrics(events, scans, monitoredDomains, {
    firstCompletedScan: t('activation.firstCompletedScan'),
    firstCompletedScanNote: t('activation.firstCompletedScanNote'),
    secondCompletedScan: t('activation.secondCompletedScan'),
    secondCompletedScanNote: t('activation.secondCompletedScanNote'),
    pdfExportIntent: t('activation.pdfExportIntent'),
    pdfExportIntentNote: t('activation.pdfExportIntentNote'),
    monitoringEnabled: t('activation.monitoringEnabled'),
    monitoringEnabledNote: t('activation.monitoringEnabledNote'),
  })
  const queryErrors = [
    visitsCountResult.error,
    eventsCountResult.error,
    activeGrantsResult.error,
    completedScansCountResult.error,
    visitsResult.error,
    eventsResult.error,
    campaignsResult.error,
    referralsResult.error,
    grantsResult.error,
    scansResult.error,
    monitoredDomainsResult.error,
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        sticky
        maxWidthClassName="max-w-7xl"
        right={<span className="hidden text-xs text-[#8B8A85] sm:inline">{t('adminOnly')}</span>}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/[0.08] bg-[radial-gradient(circle_at_top_left,rgba(61,220,132,0.16),transparent_32%),#121214] p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#7BC67E]">{t('eyebrow')}</p>
          <div className="mt-4 max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-[#F1F0EE] sm:text-4xl">{t('title')}</h1>
            <p className="mt-3 text-sm leading-6 text-[#A7A59F]">{t('subtitle', { limit: RECENT_LIMIT })}</p>
          </div>
        </div>

        {queryErrors.length > 0 ? (
          <div className="rounded-2xl border border-[#F5C518]/30 bg-[#F5C518]/10 p-4 text-sm text-[#FFE08A]">
            {t('partialData')}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card label={t('overview.visits')} value={visitsCountResult.count ?? 0} note={t('overview.total')} locale={locale} />
          <Card label={t('overview.events')} value={eventsCountResult.count ?? 0} note={t('overview.total')} locale={locale} />
          <Card label={t('overview.activeGrants')} value={activeGrantsResult.count ?? activeGrantCount(grants, now)} note={t('overview.activeNow')} locale={locale} />
          <Card label={t('overview.completedScans')} value={completedScansCountResult.count ?? 0} note={t('overview.total')} locale={locale} />
        </section>

        <Section title={t('channels.title')} subtitle={t('channels.subtitle', { limit: RECENT_LIMIT })}>
          <Table>
            <thead className="bg-white/[0.03]">
              <tr>
                <Th>{t('channels.source')}</Th>
                <Th>{t('channels.campaign')}</Th>
                <Th>{t('channels.visits')}</Th>
                <Th>{t('channels.visitShare')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {visitSources.length ? visitSources.map((row) => (
                <tr key={row.source}>
                  <Td>{row.source}</Td>
                  <Td>{row.campaign}</Td>
                  <Td>{formatNumber(row.visits, locale)}</Td>
                  <Td>{formatPercent(visits.length ? row.visits / visits.length : 0, locale)}</Td>
                </tr>
              )) : (
                <tr><Td>{t('empty')}</Td><Td>-</Td><Td>0</Td><Td>{formatPercent(0, locale)}</Td></tr>
              )}
            </tbody>
          </Table>
        </Section>

        <Section title={t('campaigns.title')} subtitle={t('campaigns.subtitle', { campaignLimit: CAMPAIGN_LIMIT, grantLimit: RECENT_LIMIT })}>
          <Table>
            <thead className="bg-white/[0.03]">
              <tr>
                <Th>{t('campaigns.slug')}</Th>
                <Th>{t('campaigns.active')}</Th>
                <Th>{t('campaigns.grantDays')}</Th>
                <Th>{t('campaigns.maxGrants')}</Th>
                <Th>{t('campaigns.grants')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {campaigns.length ? campaigns.map((campaign) => (
                <tr key={campaign.id}>
                  <Td>{campaign.code}</Td>
                  <Td><StatusPill>{campaign.is_active ? t('status.active') : t('status.inactive')}</StatusPill></Td>
                  <Td>{formatNumber(campaign.grant_days, locale)}</Td>
                  <Td>{campaign.max_grants === null ? t('unlimited') : formatNumber(campaign.max_grants, locale)}</Td>
                  <Td>{formatNumber(campaignGrantCounts.get(campaign.id) ?? 0, locale)}</Td>
                </tr>
              )) : (
                <tr><Td>{t('empty')}</Td><Td>-</Td><Td>-</Td><Td>-</Td><Td>0</Td></tr>
              )}
            </tbody>
          </Table>
        </Section>

        <Section title={t('referrals.title')} subtitle={t('referrals.subtitle', { referralLimit: REFERRAL_LIMIT, grantLimit: RECENT_LIMIT })}>
          <Table>
            <thead className="bg-white/[0.03]">
              <tr>
                <Th>{t('referrals.code')}</Th>
                <Th>{t('referrals.usage')}</Th>
                <Th>{t('referrals.owner')}</Th>
                <Th>{t('referrals.status')}</Th>
                <Th>{t('referrals.expires')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {referrals.length ? referrals.map((referral) => {
                const expired = referral.expires_at ? new Date(referral.expires_at) <= now : false
                const exhausted = referral.max_uses !== null && referral.uses_count >= referral.max_uses
                const status = !referral.is_active
                  ? t('status.inactive')
                  : expired
                    ? t('status.expired')
                    : exhausted
                      ? t('status.exhausted')
                      : t('status.active')

                return (
                  <tr key={referral.id}>
                    <Td>{referral.code}</Td>
                    <Td>
                      {formatNumber(referral.uses_count, locale)} / {formatNumber(referralActivatedCounts.get(referral.id) ?? 0, locale)}
                      <span className="text-[#8B8A85]"> {t('referrals.usageHint')}</span>
                    </Td>
                    <Td>{referral.owner_user_id ? t('referrals.ownerLinked') : t('referrals.ownerMissing')}</Td>
                    <Td><StatusPill>{status}</StatusPill></Td>
                    <Td>{formatDate(referral.expires_at, locale, t('labels.noExpiry'))}</Td>
                  </tr>
                )
              }) : (
                <tr><Td>{t('empty')}</Td><Td>-</Td><Td>-</Td><Td>-</Td><Td>0</Td></tr>
              )}
            </tbody>
          </Table>
        </Section>

        <Section title={t('activation.title')} subtitle={t('activation.subtitle', { limit: RECENT_LIMIT })}>
          <div className="grid gap-4 md:grid-cols-2">
            {activationRows.map((row) => (
              <Card key={row.label} label={row.label} value={row.value} note={row.note} locale={locale} />
            ))}
          </div>
        </Section>
      </main>
    </div>
  )
}
