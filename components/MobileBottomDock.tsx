'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createBrowserClient } from '@/lib/supabase-browser'

// --- Inline SVG icons ---

function HomeIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  )
}

function DashboardIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  )
}

function ZapIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

function TagIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function UserIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function LogOutIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

// --- Component ---

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
  isCta?: boolean
  matchPaths?: string[]
}

export default function MobileBottomDock() {
  const pathname = usePathname()
  const router = useRouter()
  const [isSignedIn, setIsSignedIn] = useState(false)

  useEffect(() => {
    const supabase = createBrowserClient()

    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSignOut() {
    const supabase = createBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const items: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: <HomeIcon size={22} />,
      matchPaths: ['/'],
    },
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <DashboardIcon size={22} />,
      matchPaths: ['/dashboard'],
    },
    {
      label: 'Scan',
      href: '/#scan',
      icon: <ZapIcon size={22} />,
      isCta: true,
    },
    {
      label: 'Pricing',
      href: '/pricing',
      icon: <TagIcon size={22} />,
      matchPaths: ['/pricing'],
    },
  ]

  function isActive(item: NavItem): boolean {
    if (item.isCta) return false
    if (!item.matchPaths) return false
    // Exact match for home, prefix match for others
    if (item.href === '/') return pathname === '/'
    return item.matchPaths.some(p => pathname.startsWith(p))
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#0E0E0F]/80 backdrop-blur-xl border-t border-white/[0.06]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = isActive(item)

          if (item.isCta) {
            return (
              <Link key={item.label} href={item.href} aria-label={item.label}>
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex items-center justify-center w-12 h-12 rounded-full bg-[#6E56CF] text-white shadow-[0_4px_24px_rgba(110,86,207,0.45)]"
                >
                  {item.icon}
                </motion.div>
              </Link>
            )
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center gap-0.5 min-w-[52px]"
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-0.5"
                style={{ color: active ? '#6E56CF' : '#8B8A85' }}
              >
                {item.icon}
                <span className="text-[10px] leading-none font-medium">{item.label}</span>
              </motion.div>
            </Link>
          )
        })}

        {isSignedIn ? (
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleSignOut}
            aria-label="Sign Out"
            className="flex flex-col items-center gap-0.5 min-w-[52px] bg-transparent border-0 cursor-pointer"
            style={{ color: '#8B8A85' }}
          >
            <LogOutIcon size={22} />
            <span className="text-[10px] leading-none font-medium">Sign Out</span>
          </motion.button>
        ) : (
          <Link
            href="/auth/login"
            className="flex flex-col items-center gap-0.5 min-w-[52px]"
            aria-label="Sign In"
            aria-current={pathname.startsWith('/auth/login') ? 'page' : undefined}
          >
            <motion.div
              whileTap={{ scale: 0.9 }}
              className="flex flex-col items-center gap-0.5"
              style={{ color: pathname.startsWith('/auth/login') ? '#6E56CF' : '#8B8A85' }}
            >
              <UserIcon size={22} />
              <span className="text-[10px] leading-none font-medium">Sign In</span>
            </motion.div>
          </Link>
        )}
      </div>
    </nav>
  )
}
