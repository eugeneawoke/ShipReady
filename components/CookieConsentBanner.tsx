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

export function CookieConsentBanner() {
  const t = useTranslations('CookieConsent')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getConsent()) setVisible(true)
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
    <div
      role="dialog"
      aria-label={t('ariaLabel')}
      className="fixed bottom-0 inset-x-0 z-50 border-t border-white/[0.08] bg-[#161618] px-4 py-3 sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#8B8A85] leading-relaxed">
          {t('text')}{' '}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-[#F1F0EE] transition-colors"
          >
            {t('privacyLink')}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={handleDecline}
            className="rounded-lg border border-white/[0.08] bg-transparent px-4 py-1.5 text-xs text-[#8B8A85] transition-colors hover:text-[#F1F0EE]"
          >
            {t('decline')}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            className="rounded-lg bg-[#6E56CF] px-4 py-1.5 text-xs text-white transition-opacity hover:opacity-90"
          >
            {t('accept')}
          </button>
        </div>
      </div>
    </div>
  )
}
