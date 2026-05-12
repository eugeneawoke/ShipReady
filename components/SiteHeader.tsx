'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher'

interface HeaderNavItem {
  label: string
  href: string
}

interface SiteHeaderProps {
  right?: ReactNode
  children?: ReactNode
  sticky?: boolean
  maxWidthClassName?: string
  paddingClassName?: string
  mobileNavItems?: HeaderNavItem[]
  mobileActions?: ReactNode
  mobileMenuLabel?: string
}

export function SiteBrandLink({ className = '' }: { className?: string }) {
  const t = useTranslations('SiteHeader')

  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-sm font-semibold tracking-tight text-[#F1F0EE] transition-opacity hover:opacity-80 ${className}`.trim()}
    >
      <Image src="/logo.svg" alt={t('brandAlt')} width={28} height={28} className="h-7 w-7 shrink-0" />
      <span>ShipReady</span>
    </Link>
  )
}

export function SiteHeader({
  right,
  children,
  sticky = false,
  maxWidthClassName = 'max-w-6xl',
  paddingClassName = 'px-6',
  mobileNavItems = [],
  mobileActions,
  mobileMenuLabel = 'Open navigation menu',
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mobileOpen) return

    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [mobileOpen])

  const hasMobileMenu = mobileNavItems.length > 0 || Boolean(mobileActions)
  const mobileMenu = hasMobileMenu && mobileOpen ? (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-default bg-black/50 backdrop-blur-sm md:hidden"
        aria-label="Close navigation menu"
        onClick={() => setMobileOpen(false)}
      />
      <div
        id="site-mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed inset-x-0 top-0 z-50 box-border max-h-[calc(100vh-4rem)] overflow-y-auto rounded-b-2xl border-b border-white/[0.08] bg-[#161618] px-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] md:hidden"
        style={{
          paddingTop: 'calc(0.75rem + env(safe-area-inset-top))',
          paddingBottom: '1rem',
        }}
      >
        <div className="mx-auto mb-2 h-1 w-12 rounded-full bg-white/20" />
        {mobileNavItems.length > 0 ? (
          <nav className="py-1">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block min-h-12 border-b border-white/[0.05] px-1 py-4 text-base text-[#F1F0EE] transition-colors last:border-b-0 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
        {mobileActions ? (
          <div className="mt-3 grid gap-2 border-t border-white/[0.06] pt-4">
            {mobileActions}
          </div>
        ) : null}
      </div>
    </>
  ) : null

  return (
    <>
      <header className={`${sticky ? 'sticky top-0 z-50' : ''} border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md`}>
        <div className={`${maxWidthClassName} mx-auto ${paddingClassName} min-h-14 flex items-center gap-4 justify-between`}>
          <div className="flex min-w-0 items-center gap-3">
            <SiteBrandLink />
            {children}
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            {right}
            {hasMobileMenu ? (
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#8B8A85] transition-colors hover:bg-white/[0.04] hover:text-[#F1F0EE] md:hidden"
                aria-label={mobileMenuLabel}
                aria-expanded={mobileOpen}
                aria-controls="site-mobile-menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
      </header>
      {typeof document !== 'undefined' && mobileMenu ? createPortal(mobileMenu, document.body) : null}
    </>
  )
}
