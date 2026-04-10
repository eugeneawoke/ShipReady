'use client'

import { ArrowLeft } from 'lucide-react'
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
      className={`flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE] ${className}`.trim()}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      <span>{label ?? t('back')}</span>
    </button>
  )
}
