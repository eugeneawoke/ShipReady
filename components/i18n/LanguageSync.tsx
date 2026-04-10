'use client'

import { useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { localeCookieName, type AppLocale } from '@/lib/i18n'

function getPreferredLocale(): AppLocale {
  const candidates = navigator.languages.length > 0
    ? navigator.languages
    : [navigator.language]

  return candidates.some((value) => value.toLowerCase().startsWith('ru')) ? 'ru' : 'en'
}

function persistLocale(locale: AppLocale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; samesite=lax`
  document.documentElement.lang = locale
}

export function LanguageSync() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const [, startTransition] = useTransition()

  useEffect(() => {
    const preferredLocale = getPreferredLocale()
    persistLocale(preferredLocale)

    if (preferredLocale !== locale) {
      startTransition(() => {
        router.refresh()
      })
    }
  }, [locale, router])

  return null
}
