'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'

const CONSENT_COOKIE = 'glook-consent'

function getConsent(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.split(';').find((c) => c.trim().startsWith(`${CONSENT_COOKIE}=`))
  return match ? match.trim().slice(CONSENT_COOKIE.length + 1) : null
}

function setConsent(value: 'accepted' | 'declined') {
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax${secure}`
}

export function CookieConsentBanner({ initialConsent }: { initialConsent: string | null }) {
  const t = useTranslations('CookieConsent')
  // SSR: show when no consent cookie — scanner sees Accept/Decline in HTML
  const [visible, setVisible] = useState(!initialConsent)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setVisible(!getConsent())
  }, [])

  function handleAccept() {
    setConsent('accepted')
    setVisible(false)
  }

  function handleDecline() {
    setConsent('declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Desktop: floating card bottom-right */}
      <div
        id="cookie-consent"
        role="dialog"
        aria-label={t('ariaLabel')}
        data-cookie-consent="true"
        style={mounted ? { animation: 'cookieSlideIn 0.3s ease-out' } : undefined}
        className="
          fixed z-50 hidden sm:block
          bottom-5 right-5
          w-[240px]
          bg-[#1C1C1E] border border-white/[0.12] rounded-2xl
          p-4
          shadow-[0_16px_48px_rgba(0,0,0,0.6),0_0_0_1px_rgba(110,86,207,0.08)]
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true">🍪</span>
          <span className="text-[#F1F0EE] text-[11px] font-semibold font-mono">
            {t('title')}
          </span>
        </div>
        <p className="text-[#8B8A85] text-[10px] leading-relaxed font-mono mb-3">
          {t('text')}{' '}
          <Link href="/privacy" className="text-[#6E56CF] underline underline-offset-2 hover:opacity-80 transition-opacity">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 rounded-lg border border-white/[0.10] bg-white/[0.06] py-1.5 text-[10px] font-mono text-[#8B8A85] transition-colors hover:text-[#F1F0EE]"
          >
            {t('decline')}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded-lg bg-[#6E56CF] py-1.5 text-[10px] font-mono font-medium text-white transition-opacity hover:opacity-90"
          >
            {t('accept')}
          </button>
        </div>
      </div>

      {/* Mobile: bottom sheet full-width */}
      <div
        id="cookie-consent-mobile"
        role="dialog"
        aria-label={t('ariaLabel')}
        data-cookie-consent="true"
        style={mounted ? { animation: 'cookieSlideIn 0.3s ease-out' } : undefined}
        className="
          fixed z-50 sm:hidden
          bottom-0 left-0 right-0
          bg-[#1C1C1E] border-t border-white/[0.10] rounded-t-2xl
          px-4 pb-6 pt-4
          shadow-[0_-8px_32px_rgba(0,0,0,0.4)]
        "
      >
        <div className="flex items-center gap-2 mb-2">
          <span aria-hidden="true">🍪</span>
          <span className="text-[#F1F0EE] text-[11px] font-semibold font-mono">
            {t('title')}
          </span>
        </div>
        <p className="text-[#8B8A85] text-[10px] leading-relaxed font-mono mb-3">
          {t('text')}{' '}
          <Link href="/privacy" className="text-[#6E56CF] underline underline-offset-2 hover:opacity-80 transition-opacity">
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="flex-1 rounded-lg border border-white/[0.10] bg-white/[0.06] py-2 text-[11px] font-mono text-[#8B8A85] transition-colors hover:text-[#F1F0EE]"
          >
            {t('decline')}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="flex-1 rounded-lg bg-[#6E56CF] py-2 text-[11px] font-mono font-medium text-white transition-opacity hover:opacity-90"
          >
            {t('accept')}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes cookieSlideIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
