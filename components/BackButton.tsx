'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import type { MouseEvent } from 'react'

interface BackButtonProps {
  fallbackHref?: string
  label?: string
  className?: string
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
}

export function BackButton({
  fallbackHref = '/',
  label,
  className = '',
  onClick,
}: BackButtonProps) {
  const router = useRouter()
  const t = useTranslations('Common')

  function handleBack(event: MouseEvent<HTMLButtonElement>) {
    if (onClick) {
      onClick(event)
      return
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push(fallbackHref)
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`flex items-center gap-1.5 font-semibold tracking-tight text-[#F1F0EE] transition-colors hover:text-[#8B8A85] ${className}`.trim()}
    >
      <span aria-hidden="true">←</span>
      <span>{label ?? t('back')}</span>
    </button>
  )
}
