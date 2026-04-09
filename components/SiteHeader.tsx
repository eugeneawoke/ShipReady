'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface SiteHeaderProps {
  right?: ReactNode
  children?: ReactNode
  sticky?: boolean
  maxWidthClassName?: string
  paddingClassName?: string
}

export function SiteBrandLink({ className = '' }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`flex items-center gap-2 text-sm font-semibold tracking-tight text-[#F1F0EE] transition-opacity hover:opacity-80 ${className}`.trim()}
    >
      <Image src="/logo.svg" alt="ShipReady logo" width={28} height={28} className="h-7 w-7 shrink-0" />
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
}: SiteHeaderProps) {
  return (
    <header className={`${sticky ? 'sticky top-0 z-50' : ''} border-b border-white/[0.06] bg-[#0E0E0F]/80 backdrop-blur-md`}>
      <div className={`${maxWidthClassName} mx-auto ${paddingClassName} min-h-14 flex items-center gap-4 justify-between`}>
        <div className="flex min-w-0 items-center gap-3">
          <SiteBrandLink />
          {children}
        </div>
        {right ? <div className="flex items-center gap-4">{right}</div> : <div />}
      </div>
    </header>
  )
}
