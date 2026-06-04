'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useTranslations } from 'next-intl'

/**
 * Auth-aware nav button for focused landing pages (/seo, /security, /ai-visibility).
 * Those pages are server components (for metadata), so auth state is read here
 * on the client side as a small island. Shows "Dashboard" if logged in, "Sign in" otherwise.
 */
export function LandingNavAuth() {
  const t = useTranslations('Landing.nav')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return

    const supabase = createBrowserClient(url, key)

    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session?.user)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (isLoggedIn) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-[#6E56CF] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
      >
        {t('dashboard')}
      </Link>
    )
  }

  return (
    <Link
      href="/auth/login"
      className="rounded-lg bg-[#6E56CF] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#7C68D4] transition-colors"
    >
      {t('signIn')}
    </Link>
  )
}
