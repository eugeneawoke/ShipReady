import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { getUserWithPlan } from '@/lib/auth'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ScanForm } from '@/components/landing/ScanForm'

export default async function DashboardPage() {
  const user = await getUserWithPlan()
  if (!user) redirect('/auth/login')

  const supabase = await createClient()
  const { data: scans } = await supabase
    .from('scans')
    .select('id, url, status, results, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const planLabel = user.plan === 'pro' ? 'Pro' : user.plan === 'agency' ? 'Agency' : 'Free'
  const planColor = user.plan === 'free' ? 'text-[#8B8A85]' : 'text-[#3DDC84]'

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
          <div className="space-y-2">
            {scans.map((scan) => {
              const score = scan.results?.totalScore ?? null
              const scoreColor = score === null ? '' : score >= 90 ? 'text-[#3DDC84]' : score >= 70 ? 'text-[#7BC67E]' : score >= 50 ? 'text-[#F5C518]' : 'text-[#FF4444]'
              const date = new Date(scan.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

              return (
                <Link
                  key={scan.id}
                  href={`/report/${scan.id}`}
                  className="flex items-center justify-between p-4 rounded-xl bg-[#161618] border border-white/[0.06] hover:border-white/[0.12] transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-[#F1F0EE] transition-colors">
                      {scan.url}
                    </p>
                    <p className="text-xs text-[#5A5955] mt-0.5">{date}</p>
                  </div>
                  <div className="flex items-center gap-4 ml-4 shrink-0">
                    {scan.status === 'done' && score !== null ? (
                      <span className={`text-sm font-semibold font-mono ${scoreColor}`}>{score}</span>
                    ) : scan.status === 'running' || scan.status === 'pending' ? (
                      <span className="text-xs text-[#8B8A85]">scanning…</span>
                    ) : scan.status === 'error' ? (
                      <span className="text-xs text-[#FF6B6B]">error</span>
                    ) : null}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#5A5955] group-hover:text-[#8B8A85] transition-colors">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              )
            })}
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
