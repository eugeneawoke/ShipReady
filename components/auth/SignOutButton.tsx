'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="text-xs text-[#5A5955] hover:text-[#F1F0EE] transition-colors cursor-pointer"
    >
      Sign out
    </button>
  )
}
