'use client'

import { useRouter } from 'next/navigation'

export function BackButton() {
  const router = useRouter()

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="font-semibold tracking-tight text-[#F1F0EE] hover:text-[#8B8A85] transition-colors flex items-center gap-1.5"
    >
      ← Back
    </button>
  )
}
