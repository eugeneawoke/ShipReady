'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase-browser'

export function SignOutButton() {
  const router = useRouter()
  const t = useTranslations('Dashboard')

  async function signOut() {
    const supabase = createBrowserClient()
    if (!supabase) return

    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors cursor-pointer"
    >
      {t('signOut')}
    </button>
  )
}
