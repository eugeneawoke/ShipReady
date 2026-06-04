'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'

const MODES = [
  {
    href: '/seo',
    icon: '🔍',
    key: 'seo' as const,
    color: 'from-blue-500/10 to-transparent border-blue-500/20',
  },
  {
    href: '/security',
    icon: '🛡️',
    key: 'security' as const,
    color: 'from-orange-500/10 to-transparent border-orange-500/20',
  },
  {
    href: '/ai-visibility',
    icon: '🤖',
    key: 'aiVisibility' as const,
    color: 'from-violet-500/10 to-transparent border-violet-500/20',
  },
]

export function ModePicker() {
  const t = useTranslations('Landing.modePicker')

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <p className="mb-6 text-center text-sm text-[#8B8A85]">{t('orStart')}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {MODES.map((mode) => (
          <Link
            key={mode.href}
            href={mode.href}
            className={`group flex flex-col gap-3 rounded-2xl border bg-gradient-to-b p-5 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${mode.color}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">{mode.icon}</span>
              <span className="font-semibold text-[#F1F0EE]">{t(`modes.${mode.key}.title`)}</span>
            </div>
            <p className="text-sm font-medium text-[#F1F0EE]/80">{t(`modes.${mode.key}.tagline`)}</p>
            <p className="text-xs leading-relaxed text-[#8B8A85]">{t(`modes.${mode.key}.description`)}</p>
            <span className="mt-auto text-xs text-[#6E56CF] group-hover:text-[#7C68D4]">
              {t(`modes.${mode.key}.run`)}
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
