'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2, Radar } from 'lucide-react'

interface MonitoringToggleProps {
  domain: string
  enabled: boolean
  canManage: boolean
}

export function MonitoringToggle({ domain, enabled, canManage }: MonitoringToggleProps) {
  const router = useRouter()
  const t = useTranslations('Monitoring')
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsEnabled(enabled)
  }, [enabled])

  async function toggle() {
    if (!canManage || pending) return

    setPending(true)
    setError(null)
    const nextEnabled = !isEnabled
    try {
      const res = await fetch('/api/monitor', {
        method: isEnabled ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Request failed')
      }

      setIsEnabled(nextEnabled)
      router.refresh()
    } catch (error) {
      console.error('[monitoring] toggle failed', error)
      setError(error instanceof Error ? error.message : t('error'))
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        disabled={!canManage || pending}
        onClick={toggle}
        className={`group inline-flex min-h-11 items-center gap-3 rounded-full border px-3 py-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          isEnabled
            ? 'border-[#3DDC84]/25 bg-[#3DDC84]/10 shadow-[0_0_0_1px_rgba(61,220,132,0.05)]'
            : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]'
        }`}
        aria-label={isEnabled ? t('ariaDisable', { domain }) : t('ariaEnable', { domain })}
      >
        <div className={`flex h-7 w-12 items-center rounded-full px-1 transition-colors ${
          isEnabled ? 'bg-[#3DDC84]/90' : 'bg-white/[0.10]'
        }`}>
          <div className={`h-5 w-5 rounded-full bg-[#0E0E0F] shadow-sm transition-transform duration-200 ${
            isEnabled ? 'translate-x-5' : 'translate-x-0'
          }`} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Radar className={`h-3.5 w-3.5 ${isEnabled ? 'text-[#3DDC84]' : 'text-[#8B8A85]'}`} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8B8A85]">{t('monitor')}</span>
          </div>
          <div className={`mt-0.5 text-xs font-medium ${isEnabled ? 'text-[#E9FFF1]' : 'text-[#C7C5C0]'}`}>
            {pending ? t('updating') : isEnabled ? t('trackingWeekly') : t('notTracking')}
          </div>
        </div>

        <div className="ml-1 flex items-center">
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#8B8A85]" />
          ) : (
            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              isEnabled
                ? 'bg-[#3DDC84]/15 text-[#B8F5CD]'
                : 'bg-white/[0.06] text-[#8B8A85]'
            }`}>
              {isEnabled ? t('on') : t('off')}
            </span>
          )}
        </div>
      </button>

      {error ? <p className="max-w-[220px] text-right text-[11px] text-[#FF6B6B]">{error}</p> : null}
    </div>
  )
}
