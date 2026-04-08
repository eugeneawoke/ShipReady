'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface MonitoringToggleProps {
  domain: string
  enabled: boolean
  canManage: boolean
}

export function MonitoringToggle({ domain, enabled, canManage }: MonitoringToggleProps) {
  const [isEnabled, setIsEnabled] = useState(enabled)
  const [pending, setPending] = useState(false)

  async function toggle() {
    if (!canManage || pending) return

    setPending(true)
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

      setIsEnabled((current) => !current)
    } catch (error) {
      console.error('[monitoring] toggle failed', error)
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      disabled={!canManage || pending}
      onClick={toggle}
      className={`inline-flex h-8 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        isEnabled
          ? 'border-[#3DDC84]/35 bg-[#3DDC84]/10 text-[#B8F5CD] hover:bg-[#3DDC84]/14'
          : 'border-white/[0.08] bg-white/[0.03] text-[#8B8A85] hover:bg-white/[0.06] hover:text-[#F1F0EE]'
      }`}
      aria-label={isEnabled ? `Disable weekly monitoring for ${domain}` : `Enable weekly monitoring for ${domain}`}
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
      {isEnabled ? 'Monitored' : 'Monitor'}
    </button>
  )
}
