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
  id: string
  anonymous_id: string | null
  user_id: string | null
  campaign_id: string | null
  referral_code_id: string | null
  utm_source: string | null
  utm_campaign: string | null
  created_at: string
}

type GrowthEventRow = {
  event_name: string
  user_id: string | null
  anonymous_id: string | null
  visit_id: string | null
  campaign_id: string | null
  referral_code_id: string | null
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

type ChannelActivationRow = {
  key: string
  source: string
  campaign: string
  visits: number
  signupStarted: number
  scanStarted: number
  pdfClicks: number
  monitoringEnabled: number
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

function channelKeyFromVisit(visit: GrowthVisitRow, labels: { unknown: string }): string {
  const source = emptyLabel(visit.utm_source, labels.unknown)
  const campaign = emptyLabel(visit.utm_campaign, labels.unknown)
  return `${source}\u0000${campaign}`
}

function emptyChannelRow(key: string, source: string, campaign: string): ChannelActivationRow {
  return {
    key,
    source,
    campaign,
    visits: 0,
    signupStarted: 0,
    scanStarted: 0,
    pdfClicks: 0,
    monitoringEnabled: 0,
  }
}

function rememberReferenceChannelKey(map: Map<string, string | null>, referenceId: string, channelKey: string) {
  if (!map.has(referenceId)) {
    map.set(referenceId, channelKey)
    return
  }

  if (map.get(referenceId) !== channelKey) {
    map.set(referenceId, null)
  }
}

function groupChannelActivation(
  visits: GrowthVisitRow[],
  events: GrowthEventRow[],
  labels: { unknown: string },
): ChannelActivationRow[] {
  const rows = new Map<string, ChannelActivationRow>()
  const visitChannelKeys = new Map<string, string>()
  const campaignChannelKeys = new Map<string, string | null>()
  const referralChannelKeys = new Map<string, string | null>()

  for (const visit of visits) {
    const source = emptyLabel(visit.utm_source, labels.unknown)
    const campaign = emptyLabel(visit.utm_campaign, labels.unknown)
    const key = channelKeyFromVisit(visit, labels)
    const row = rows.get(key) ?? emptyChannelRow(key, source, campaign)
    row.visits += 1
    rows.set(key, row)
    visitChannelKeys.set(visit.id, key)
    if (visit.campaign_id) rememberReferenceChannelKey(campaignChannelKeys, visit.campaign_id, key)
    if (visit.referral_code_id) rememberReferenceChannelKey(referralChannelKeys, visit.referral_code_id, key)
  }

  for (const event of events) {
    const key = event.visit_id
      ? visitChannelKeys.get(event.visit_id)
      : event.referral_code_id
        ? referralChannelKeys.get(event.referral_code_id)
        : event.campaign_id
          ? campaignChannelKeys.get(event.campaign_id)
          : undefined

    if (!key) continue

    const row = rows.get(key)
    if (!row) continue

    if (event.event_name === 'signup_started') row.signupStarted += 1
    if (event.event_name === 'scan_started') row.scanStarted += 1
    if (event.event_name === 'pdf_export_clicked') row.pdfClicks += 1
    if (event.event_name === 'monitoring_enabled') row.monitoringEnabled += 1
  }

  return Array.from(rows.values()).sort((a, b) => {
    const activationDelta =
      (b.signupStarted + b.scanStarted + b.pdfClicks + b.monitoringEnabled) -
      (a.signupStarted + a.scanStarted + a.pdfClicks + a.monitoringEnabled)
    return activationDelta || b.visits - a.visits
  })
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
      .select('id, anonymous_id, user_id, campaign_id, referral_code_id, utm_source, utm_campaign, created_at')
      .order('created_at', { ascending: false })
      .limit(RECENT_LIMIT),
    serviceSupabase
      .from('growth_events')
      .select('event_name, user_id, anonymous_id, visit_id, campaign_id, referral_code_id, created_at')
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
  ])

  const visits = (visitsResult.data ?? []) as GrowthVisitRow[]
  const events = (eventsResult.data ?? []) as GrowthEventRow[]
  const campaigns = (campaignsResult.data ?? []) as CampaignRow[]
  const referrals = (referralsResult.data ?? []) as ReferralRow[]
  const grants = (grantsResult.data ?? []) as GrantRow[]
  const campaignGrantCounts = countByNullableId(grants, 'campaign_id')
  const referralActivatedCounts = countDistinctGrantUsersByReferral(grants)
  const channelActivationRows = groupChannelActivation(visits, events, { unknown: t('labels.unknown') })
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
                <Th>{t('channels.signups')}</Th>
                <Th>{t('channels.scanStarted')}</Th>
                <Th>{t('channels.pdfClicks')}</Th>
                <Th>{t('channels.monitoringEnabled')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {channelActivationRows.length ? channelActivationRows.map((row) => (
                <tr key={row.key}>
                  <Td>{row.source}</Td>
                  <Td>{row.campaign}</Td>
                  <Td>{formatNumber(row.visits, locale)}</Td>
                  <Td>{formatNumber(row.signupStarted, locale)}</Td>
                  <Td>{formatNumber(row.scanStarted, locale)}</Td>
                  <Td>{formatNumber(row.pdfClicks, locale)}</Td>
                  <Td>{formatNumber(row.monitoringEnabled, locale)}</Td>
                </tr>
              )) : (
                <tr><Td>{t('empty')}</Td><Td>-</Td><Td>0</Td><Td>0</Td><Td>0</Td><Td>0</Td><Td>0</Td></tr>
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
      </main>
    </div>
  )
}
