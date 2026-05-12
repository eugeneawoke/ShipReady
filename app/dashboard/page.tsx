import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getLocale, getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase'
import { getUserWithPlan } from '@/lib/auth'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ScanForm } from '@/components/landing/ScanForm'
import { MonitoringToggle } from '@/components/dashboard/MonitoringToggle'
import { BetaAccessPanel } from '@/components/dashboard/BetaAccessPanel'
import { domainFromUrl } from '@/lib/monitoring/domains'
import { SiteHeader } from '@/components/SiteHeader'

export const metadata: Metadata = { robots: { index: false, follow: false } }

export default async function DashboardPage() {
  const t = await getTranslations('Dashboard')
  const tCommon = await getTranslations('Common')
  const locale = await getLocale()
  const user = await getUserWithPlan()
  if (!user) redirect('/auth/login')

  const supabase = await createClient()
  const { data: scans } = await supabase
    .from('scans')
    .select('id, url, status, results, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const { data: monitoredDomains } = await supabase
    .from('monitored_domains')
    .select('domain, active, last_alerted_at')
    .eq('user_id', user.id)

  const { data: referralCode } = await supabase
    .from('referral_codes')
    .select('code')
    .eq('owner_user_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('plan_id, billing_interval, current_period_end, status')
    .eq('user_id', user.id)
    .eq('provider', 'payproglobal')
    .maybeSingle()

  const monitoringMap = new Map(
    (monitoredDomains ?? []).map((item) => [item.domain, item])
  )

  const effectivePlan = user.effectivePlan
  const planLabel = effectivePlan === 'pro' ? t('plan.pro') : effectivePlan === 'agency' ? t('plan.agency') : t('plan.free')
  const planColor = effectivePlan === 'free' ? 'text-[#8B8A85]' : 'text-[#3DDC84]'
  const trackedScanCount = (scans ?? []).filter((scan) => {
    const domain = domainFromUrl(scan.url)
    return domain ? Boolean(monitoringMap.get(domain)?.active) : false
  }).length

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        sticky
        right={(
          <>
            <span className={`text-xs font-mono ${planColor}`}>{planLabel}</span>
            <span className="text-xs text-[#5A5955] hidden sm:block">{user.email}</span>
            <SignOutButton />
          </>
        )}
      />

      <div className="max-w-4xl mx-auto px-6 py-12 pb-20 md:pb-12">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE] min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            <span>{tCommon('back')}</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">{t('title')}</h1>
          <p className="text-sm text-[#5A5955]">
            {effectivePlan === 'free'
              ? t('freeUsage', { used: user.scansThisMonth })
              : t('unlimited')}
          </p>
        </div>

        {user.activeBetaGrant ? (
          <BetaAccessPanel
            activeBetaGrant={user.activeBetaGrant}
            userId={user.id}
            referralCode={referralCode?.code ?? null}
          />
        ) : null}

        {/* Billing status — only shown for users with a PayPro subscription record */}
        {dbSubscription && (
          <div className={`mb-6 p-5 rounded-2xl border ${
            dbSubscription.status === 'payment_failed' || dbSubscription.status === 'suspended'
              ? 'bg-[#FF4444]/[0.06] border-[#FF4444]/25'
              : 'bg-[#161618] border-white/[0.06]'
          }`}>
            <p className="text-[10px] text-[#5A5955] uppercase tracking-[0.15em] font-mono mb-2">
              {t('billing.eyebrow')}
            </p>

            {dbSubscription.status === 'active' && dbSubscription.current_period_end ? (
              <div className="space-y-1.5">
                <p className="text-sm text-[#F1F0EE]">
                  {t('billing.renewsOn', {
                    date: new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    }).format(new Date(dbSubscription.current_period_end)),
                  })}
                </p>
                <p className="text-xs text-[#5A5955]">
                  {dbSubscription.billing_interval === 'yearly'
                    ? t('billing.billingYearly')
                    : t('billing.billingMonthly')}
                  {' · '}
                  {t('billing.cancelNote')}{' '}
                  <a href="mailto:support@shipready.app" className="text-[#8B8A85] underline underline-offset-2 hover:text-[#F1F0EE]">
                    {t('billing.cancelEmail')}
                  </a>
                </p>
              </div>
            ) : dbSubscription.status === 'payment_failed' ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#FF6B6B]">{t('billing.paymentFailed')}</p>
                <p className="text-xs text-[#8B8A85]">{t('billing.paymentFailedSub')}</p>
              </div>
            ) : dbSubscription.status === 'suspended' ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#FF6B6B]">{t('billing.suspended')}</p>
                <p className="text-xs text-[#8B8A85]">{t('billing.suspendedSub')}</p>
              </div>
            ) : null}
          </div>
        )}

        {/* New scan form */}
        <div className="mb-10">
          <ScanForm />
        </div>

        {/* Scans list */}
        {!scans || scans.length === 0 ? (
          <div className="py-16 text-center text-[#5A5955]">
            <p className="text-sm">{t('empty')}</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#121214] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#8B8A85]">
                {effectivePlan === 'free'
                  ? t('monitorUpsell')
                  : t('monitoringSummary', { count: trackedScanCount })}
              </div>
              {effectivePlan !== 'free' && trackedScanCount > 0 ? (
                <div className="text-xs font-mono text-[#3DDC84]">{t('monitoringActive')}</div>
              ) : null}
            </div>

            <div className="space-y-2">
            {scans.map((scan) => {
              const score = scan.results?.totalScore ?? null
              const scoreColor = score === null ? '' : score >= 90 ? 'text-[#3DDC84]' : score >= 70 ? 'text-[#7BC67E]' : score >= 50 ? 'text-[#F5C518]' : 'text-[#FF4444]'
              const date = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(scan.created_at))
              const domain = domainFromUrl(scan.url)
              const monitored = domain ? Boolean(monitoringMap.get(domain)?.active) : false

              return (
                <div
                  key={scan.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-[#161618] p-4 transition-colors hover:border-white/[0.12] sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4 sm:flex-1">
                    <Link href={`/report/${scan.id}`} className="min-w-0 flex-1 group">
                      <p className="truncate text-sm font-medium transition-colors group-hover:text-[#F1F0EE]">
                        {scan.url}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5A5955]">
                        <span className="hidden sm:inline">{date}</span>
                        {domain ? (
                          <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[#8B8A85]">
                            {domain}
                          </span>
                        ) : null}
                      </div>
                    </Link>

                    <Link href={`/report/${scan.id}`} className="ml-auto flex shrink-0 items-center gap-4 group">
                      {scan.status === 'done' && score !== null ? (
                        <span className={`text-sm font-semibold font-mono ${scoreColor}`}>{score}</span>
                      ) : ['running', 'running_fast', 'running_deep', 'enriching', 'pending'].includes(scan.status) ? (
                        <span className="text-xs text-[#8B8A85]">{t('scanning')}</span>
                      ) : scan.status === 'error' ? (
                        <span className="text-xs text-[#FF6B6B]">{t('error')}</span>
                      ) : null}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5A5955] transition-colors group-hover:text-[#8B8A85]">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>

                  {domain ? (
                    <MonitoringToggle
                      domain={domain}
                      enabled={monitored}
                      canManage={effectivePlan === 'pro' || effectivePlan === 'agency'}
                      className="w-full sm:w-auto"
                    />
                  ) : null}
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {effectivePlan === 'free' && (
          <div className="mt-10 p-5 rounded-2xl bg-[#6E56CF]/10 border border-[#6E56CF]/25 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t('upgradeTitle')}</p>
              <p className="text-xs text-[#8B8A85] mt-0.5">{t('upgradeSubtitle')}</p>
            </div>
            <Link
              href="/#pricing"
              className="shrink-0 px-4 py-2 rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors"
            >
              {t('upgradeCta')}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
