import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getUserWithPlan } from '@/lib/auth'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ScanForm } from '@/components/landing/ScanForm'
import { MonitoringToggle } from '@/components/dashboard/MonitoringToggle'
import { domainFromUrl } from '@/lib/monitoring/domains'

export default async function DashboardPage() {
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

  const monitoringMap = new Map(
    (monitoredDomains ?? []).map((item) => [item.domain, item])
  )

  const planLabel = user.plan === 'pro' ? 'Pro' : user.plan === 'agency' ? 'Agency' : 'Free'
  const planColor = user.plan === 'free' ? 'text-[#8B8A85]' : 'text-[#3DDC84]'
  const trackedScanCount = (scans ?? []).filter((scan) => {
    const domain = domainFromUrl(scan.url)
    return domain ? Boolean(monitoringMap.get(domain)?.active) : false
  }).length

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Nav */}
      <nav className="border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            ShipReady
          </Link>
          <div className="flex items-center gap-4">
            <span className={`text-xs font-mono ${planColor}`}>{planLabel}</span>
            <span className="text-xs text-[#5A5955] hidden sm:block">{user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight mb-1">Your scans</h1>
          <p className="text-sm text-[#5A5955]">
            {user.plan === 'free'
              ? `${user.scansThisMonth} / 3 scans used this month`
              : 'Unlimited scans'}
          </p>
        </div>

        {/* New scan form */}
        <div className="mb-10">
          <ScanForm />
        </div>

        {/* Scans list */}
        {!scans || scans.length === 0 ? (
          <div className="py-16 text-center text-[#5A5955]">
            <p className="text-sm">No scans yet. Run your first scan to see results here.</p>
          </div>
        ) : (
          <div>
            <div className="mb-4 flex flex-col gap-2 rounded-xl border border-white/[0.06] bg-[#121214] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-[#8B8A85]">
                {user.plan === 'free'
                  ? 'Upgrade to monitor domains weekly from your scan list.'
                  : `${trackedScanCount} scan${trackedScanCount === 1 ? '' : 's'} tracked · runs every Monday`}
              </div>
              {user.plan !== 'free' && trackedScanCount > 0 ? (
                <div className="text-xs font-mono text-[#3DDC84]">Weekly monitoring active</div>
              ) : null}
            </div>

            <div className="space-y-2">
            {scans.map((scan) => {
              const score = scan.results?.totalScore ?? null
              const scoreColor = score === null ? '' : score >= 90 ? 'text-[#3DDC84]' : score >= 70 ? 'text-[#7BC67E]' : score >= 50 ? 'text-[#F5C518]' : 'text-[#FF4444]'
              const date = new Date(scan.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
              const domain = domainFromUrl(scan.url)
              const monitored = domain ? Boolean(monitoringMap.get(domain)?.active) : false

              return (
                <div
                  key={scan.id}
                  className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-[#161618] p-4 transition-colors hover:border-white/[0.12]"
                >
                  <Link href={`/report/${scan.id}`} className="min-w-0 flex-1 group">
                    <p className="truncate text-sm font-medium transition-colors group-hover:text-[#F1F0EE]">
                      {scan.url}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#5A5955]">
                      <span>{date}</span>
                      {domain ? (
                        <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[#8B8A85]">
                          {domain}
                        </span>
                      ) : null}
                    </div>
                  </Link>

                  {domain ? (
                    <MonitoringToggle
                      domain={domain}
                      enabled={monitored}
                      canManage={user.plan === 'pro' || user.plan === 'agency'}
                    />
                  ) : null}

                  <Link href={`/report/${scan.id}`} className="ml-auto flex items-center gap-4 shrink-0 group">
                    {scan.status === 'done' && score !== null ? (
                      <span className={`text-sm font-semibold font-mono ${scoreColor}`}>{score}</span>
                    ) : ['running', 'running_fast', 'running_deep', 'enriching', 'pending'].includes(scan.status) ? (
                      <span className="text-xs text-[#8B8A85]">scanning…</span>
                    ) : scan.status === 'error' ? (
                      <span className="text-xs text-[#FF6B6B]">error</span>
                    ) : null}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5A5955] transition-colors group-hover:text-[#8B8A85]">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )
            })}
            </div>
          </div>
        )}

        {/* Upgrade banner for free users */}
        {user.plan === 'free' && (
          <div className="mt-10 p-5 rounded-2xl bg-[#6E56CF]/10 border border-[#6E56CF]/25 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Unlock unlimited scans & AI prompts</p>
              <p className="text-xs text-[#8B8A85] mt-0.5">Upgrade to Pro for $14/mo</p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 px-4 py-2 rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors"
            >
              Upgrade
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
