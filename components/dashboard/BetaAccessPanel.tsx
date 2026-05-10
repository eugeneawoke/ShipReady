'use client'

import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import type { ActiveBetaGrant } from '@/lib/auth'

type BetaAccessPanelProps = {
  activeBetaGrant: ActiveBetaGrant
  userId?: string
  referralCode?: string | null
}

export function BetaAccessPanel({ activeBetaGrant, referralCode }: BetaAccessPanelProps) {
  const t = useTranslations('Dashboard.betaAccess')
  const locale = useLocale()
  const [copied, setCopied] = useState(false)

  const referralLink = useMemo(() => {
    if (!referralCode) return null
    const params = new URLSearchParams()
    params.set('ref', referralCode)
    params.set('utm_source', 'referral')
    params.set('utm_medium', 'user')
    params.set('utm_campaign', 'beta_pro')
    return `/?${params.toString()}`
  }, [referralCode])

  const displayReferralLink = referralLink

  function absoluteReferralLink() {
    if (!referralLink) return null
    return new URL(referralLink, window.location.origin).toString()
  }

  const expiryText = activeBetaGrant.expiresAt
    ? new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(activeBetaGrant.expiresAt))
    : t('noExpiry')

  async function copyReferralLink() {
    const linkToCopy = absoluteReferralLink()
    if (!linkToCopy) return
    await navigator.clipboard.writeText(linkToCopy)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)

    await fetch('/api/growth/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: 'referral_link_copied',
        properties: { source: 'dashboard_beta_access', grantId: activeBetaGrant.id },
      }),
    }).catch(() => undefined)
  }

  return (
    <section
      aria-labelledby="beta-access-title"
      className="mb-10 overflow-hidden rounded-2xl border border-[#3DDC84]/20 bg-[#101812] shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
    >
      <div className="border-b border-white/[0.06] bg-[radial-gradient(circle_at_top_right,rgba(61,220,132,0.16),transparent_34%),linear-gradient(135deg,rgba(61,220,132,0.10),rgba(110,86,207,0.04))] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#7BC67E]">{t('eyebrow')}</p>
            <h2 id="beta-access-title" className="mt-1 text-lg font-semibold tracking-tight text-[#F1F0EE]">
              {t('title')}
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-[#8B8A85]">
              {t('subtitle', { plan: activeBetaGrant.grantedPlan.toUpperCase() })}
            </p>
          </div>
          <span className="inline-flex h-8 items-center rounded-full border border-[#3DDC84]/25 bg-[#3DDC84]/10 px-3 text-xs font-mono uppercase tracking-[0.16em] text-[#3DDC84]">
            {activeBetaGrant.grantedPlan}
          </span>
        </div>
      </div>

      <div className="grid gap-4 px-5 py-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#6F6E69]">{t('expiresLabel')}</p>
            <p className="mt-1 text-sm text-[#F1F0EE]">{expiryText}</p>
          </div>
          <div>
            <p className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#6F6E69]">{t('reasonLabel')}</p>
            <p className="mt-1 text-sm text-[#8B8A85]">{activeBetaGrant.grantReason}</p>
          </div>
          {displayReferralLink ? (
            <p className="break-all rounded-xl border border-white/[0.06] bg-[#0E0E0F]/60 px-3 py-2 text-xs text-[#8B8A85]">
              {displayReferralLink}
            </p>
          ) : (
            <p className="rounded-xl border border-white/[0.06] bg-[#0E0E0F]/60 px-3 py-2 text-xs text-[#8B8A85]">
              {t('referralComing')}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={copyReferralLink}
          disabled={!displayReferralLink}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3DDC84] ${
            displayReferralLink
              ? 'cursor-pointer border border-[#3DDC84]/25 bg-[#3DDC84] text-[#07110A] hover:bg-[#7BE39F]'
              : 'cursor-not-allowed border border-white/[0.06] bg-white/[0.03] text-[#5A5955]'
          }`}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span>{copied ? t('copied') : t('copy')}</span>
        </button>
      </div>
    </section>
  )
}
