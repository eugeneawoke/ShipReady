'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { type AppLocale } from '@/lib/i18n'

const LOCALES: AppLocale[] = ['en', 'ru']

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const t = useTranslations('LanguageSwitcher')
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  function changeLocale(nextLocale: AppLocale) {
    if (nextLocale === locale) {
      setOpen(false)
      return
    }
    setOpen(false)
    // httpOnly cookie must be set via API — document.cookie cannot write httpOnly
    fetch('/api/set-locale', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locale: nextLocale }),
    }).then(() => {
      document.documentElement.lang = nextLocale
      startTransition(() => { router.refresh() })
    })
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        disabled={isPending}
        aria-expanded={open}
        aria-label={t('ariaLabel')}
        className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-mono text-[#8B8A85] transition-colors hover:text-[#F1F0EE] disabled:cursor-wait disabled:opacity-60"
      >
        <span>{locale.toUpperCase()}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-28 overflow-hidden rounded-xl border border-white/[0.08] bg-[#161618] shadow-xl">
          {LOCALES.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => changeLocale(value)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-xs font-mono transition-colors ${
                locale === value
                  ? 'bg-white/[0.05] text-[#F1F0EE]'
                  : 'text-[#8B8A85] hover:bg-white/[0.03] hover:text-[#F1F0EE]'
              }`}
            >
              <span>{value.toUpperCase()}</span>
              <span className="font-sans text-[11px]">{t(`label.${value}`)}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
