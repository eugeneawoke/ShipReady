'use client'

import { useSearchParams } from 'next/navigation'

// Any ?ref=earlybird URL activates the early access offer.
// UTM params handle platform analytics separately — ref just unlocks the discount.
// Component is always rendered inside <Suspense> — no mounted guard needed.
const EARLY_ACCESS_REF = 'earlybird'

export function BetaIntroBanner() {
  const params = useSearchParams()

  if (params.get('ref') !== EARLY_ACCESS_REF) return null

  return (
    <div className="mb-8 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-5 text-center">
      <p className="font-semibold text-emerald-400">
        🎉 Early Access offer — choose what works for you:
      </p>
      <div className="mt-3 flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-6">
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm">
          <span className="font-medium text-white">First 3 months at $14/mo</span>
          <span className="ml-1 text-zinc-400">instead of $19</span>
        </div>
        <span className="text-xs text-zinc-500">or</span>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-2 text-sm">
          <span className="font-medium text-white">Yearly plan at $152</span>
          <span className="ml-1 text-zinc-400">instead of $190 (save 20%)</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-zinc-500">
        Prices update automatically below ↓
      </p>
    </div>
  )
}
