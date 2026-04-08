'use client'

import { useMemo, useState } from 'react'
import { Loader2, ShieldCheck, ShieldOff } from 'lucide-react'

interface MonitoringCandidate {
  domain: string
  latestUrl: string
  latestScanAt: string | null
  monitored: boolean
  active: boolean
  lastAlertedAt: string | null
}

interface MonitoringManagerProps {
  plan: 'free' | 'pro' | 'agency'
  domains: MonitoringCandidate[]
}

export function MonitoringManager({ plan, domains }: MonitoringManagerProps) {
  const [items, setItems] = useState(domains)
  const [pendingDomain, setPendingDomain] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasDomains = useMemo(() => items.length > 0, [items.length])
  const canManage = plan === 'pro' || plan === 'agency'

  async function toggle(domain: string, enable: boolean) {
    setPendingDomain(domain)
    setError(null)

    try {
      const res = await fetch('/api/monitor', {
        method: enable ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Request failed')
      }

      setItems((current) => current.map((item) => (
        item.domain === domain
          ? {
              ...item,
              monitored: enable,
              active: enable,
            }
          : item
      )))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update monitoring')
    } finally {
      setPendingDomain(null)
    }
  }

  return (
    <section className="mt-10 rounded-2xl border border-white/[0.06] bg-[#121214] p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.24em] text-[#8B8A85]">Weekly monitoring</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight">Track your domains every Monday</h2>
          <p className="mt-1 text-sm text-[#8B8A85]">
            We rescan monitored domains weekly and keep the latest scan as the monitoring baseline for alerts.
          </p>
        </div>
        <div className="text-xs text-[#5A5955]">
          {canManage ? 'Email alerts are sent to your account email.' : 'Upgrade to Pro to enable monitoring.'}
        </div>
      </div>

      {!hasDomains ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/[0.08] px-4 py-5 text-sm text-[#8B8A85]">
          Run a scan first. Your scanned domains will appear here so you can enable weekly monitoring.
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const pending = pendingDomain === item.domain
            const statusText = item.monitored && item.active ? 'Monitoring on' : 'Monitoring off'
            return (
              <div
                key={item.domain}
                className="flex flex-col gap-4 rounded-xl border border-white/[0.06] bg-[#161618] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{item.domain}</p>
                    {item.monitored && item.active ? (
                      <ShieldCheck className="h-4 w-4 text-[#3DDC84]" />
                    ) : (
                      <ShieldOff className="h-4 w-4 text-[#8B8A85]" />
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-[#5A5955]">{item.latestUrl}</p>
                  <p className="mt-1 text-xs text-[#8B8A85]">
                    {statusText}
                    {item.latestScanAt ? ` · latest scan ${new Date(item.latestScanAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                    {item.lastAlertedAt ? ` · last alert ${new Date(item.lastAlertedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canManage || pending}
                  onClick={() => toggle(item.domain, !(item.monitored && item.active))}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    item.monitored && item.active
                      ? 'border border-white/[0.1] bg-transparent text-[#F1F0EE] hover:bg-white/[0.04]'
                      : 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
                  }`}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {item.monitored && item.active ? 'Disable weekly monitoring' : 'Enable weekly monitoring'}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-[#FF6B6B]">{error}</p> : null}
    </section>
  )
}
