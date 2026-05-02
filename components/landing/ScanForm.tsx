'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

const FRIENDLY_ERRORS: Record<string, string> = {
  Forbidden: 'friendlyErrors.forbidden',
  'Failed to create scan': 'friendlyErrors.failedToCreateScan',
  'Invalid URL': 'friendlyErrors.invalidUrl',
  'Rate limit exceeded. Sign in for more scans.': 'friendlyErrors.rateLimitExceeded',
  'Free limit reached': 'friendlyErrors.freeLimitReached',
}

function friendlyMessage(raw: string, t: ReturnType<typeof useTranslations<'ScanForm'>>): string {
  const key = FRIENDLY_ERRORS[raw]
  return key ? t(key) : raw
}

export function useScanLauncher() {
  const t = useTranslations('ScanForm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ msg: string; showContact: boolean } | null>(null)
  const loadingRef = useRef(false)
  const router = useRouter()

  async function launchScan(rawUrl: string, scanGoal?: string) {
    if (loadingRef.current || !rawUrl.trim()) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const body: { url: string; scanGoal?: string } = { url: rawUrl }
      if (scanGoal) {
        body.scanGoal = scanGoal
      }
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        const raw = data.error || 'Something went wrong'
        const msg = friendlyMessage(raw, t)
        // Show contact for unexpected server errors (5xx or unknown)
        const showContact = res.status >= 500 || raw === 'Forbidden' || raw === 'Failed to create scan'
        setError({ msg, showContact })
        setLoading(false)
        loadingRef.current = false
        return
      }
      router.push(`/scan/${data.id}`)
    } catch {
      setError({ msg: t('friendlyErrors.network'), showContact: true })
      setLoading(false)
      loadingRef.current = false
    }
  }

  return {
    loading,
    error,
    launchScan,
    clearError: () => setError(null),
  }
}

const SCAN_GOALS = [
  { value: 'sales', labelKey: 'goals.sales' },
  { value: 'leads', labelKey: 'goals.leads' },
  { value: 'traffic', labelKey: 'goals.traffic' },
  { value: 'visibility', labelKey: 'goals.visibility' },
  { value: 'general', labelKey: 'goals.general' },
] as const

export function ScanForm({
  initialUrl = '',
  submitLabel,
  compact = false,
  autoFocus = false,
  className = '',
}: {
  initialUrl?: string
  submitLabel?: string
  compact?: boolean
  autoFocus?: boolean
  className?: string
}) {
  const t = useTranslations('ScanForm')
  const [url, setUrl] = useState(initialUrl)
  const [scanGoal, setScanGoal] = useState<string>('')
  const { loading, error, launchScan } = useScanLauncher()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await launchScan(url, scanGoal || undefined)
  }

  return (
    <form onSubmit={handleSubmit} className={`w-full ${compact ? '' : 'max-w-[560px] mx-auto'} ${className}`}>
      <div className={`flex gap-2 ${compact ? 'h-10' : 'h-[52px]'}`}>
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder={t('placeholder')}
          disabled={loading}
          autoFocus={autoFocus}
          className={`flex-1 h-full rounded-lg font-mono bg-[#161618] border border-white/10 text-[#F1F0EE] placeholder:text-[#5A5955] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors ${
            compact ? 'px-3 text-sm' : 'px-4 text-base sm:text-sm'
          }`}
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className={`${compact ? 'px-4' : 'px-6'} h-full rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0`}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{t('scanning')}</>
          ) : (
            submitLabel ?? t('defaultSubmit')
          )}
        </button>
      </div>

      {!compact && (
        <div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-left shadow-[0_18px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-6 min-w-6 items-center justify-center rounded-full border border-[#6E56CF]/40 bg-[#6E56CF]/16 text-[10px] font-mono text-[#CBBEFF]">
              02
            </div>
            <div className="min-w-0 flex-1">
              <label className="block text-sm font-medium tracking-[-0.01em] text-[#F1F0EE]">
                {t('goalTitle')}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-[#8B8A85]">
                {t('goalHint')}
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SCAN_GOALS.map(goal => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setScanGoal(scanGoal === goal.value ? '' : goal.value)}
                disabled={loading}
                aria-pressed={scanGoal === goal.value}
                className={`min-h-11 px-3.5 py-2 text-sm rounded-full font-medium transition-all cursor-pointer ${
                  scanGoal === goal.value
                    ? 'bg-[#6E56CF] text-white border border-[#8A73E6] shadow-[0_10px_30px_rgba(110,86,207,0.35)]'
                    : 'border border-white/10 bg-white/[0.01] text-[#B7B5B0] hover:border-white/22 hover:bg-white/[0.04] disabled:opacity-50'
                }`}
              >
                {t(goal.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 text-sm text-[#FF4444] space-y-0.5">
            <p>{error.msg}</p>
          {error.showContact && (
            <p className="text-[#8B8A85] text-xs">
              {t('contactPrefix')}{' '}
              <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">{t('contactTelegram')}</a>
              {' '}or{' '}
              <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">{t('contactEmail')}</a>
            </p>
          )}
        </div>
      )}
    </form>
  )
}
