'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Plan {
  nameKey: string
  price: string
  period: string | null
  cta: string
  highlight: boolean
  coming: boolean
}

interface PricingCtasProps {
  isLoggedIn: boolean
  plans: Plan[]
  popularLabel: string
  comingSoonLabel: string
  cancelLabel: string
  toggleMonthly: string
  toggleYearly: string
  proYearlyPrice: string
  proYearlySavings: string
}

export function PricingCtas({
  isLoggedIn,
  plans,
  popularLabel,
  comingSoonLabel,
  cancelLabel,
  toggleMonthly,
  toggleYearly,
  proYearlyPrice,
  proYearlySavings,
}: PricingCtasProps) {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleProCheckout() {
    if (!isLoggedIn) {
      router.push('/auth/login?redirect=/pricing')
      return
    }

    setLoading(true)
    try {
      const planId = billing === 'yearly' ? 'pro_yearly' : 'pro_monthly'
      const res = await fetch('/api/payments/paypro/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (!res.ok || !data.url) {
        console.error('Checkout error:', data.error)
        return
      }
      window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Monthly / yearly toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#161618] border border-white/[0.06]">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              billing === 'monthly'
                ? 'bg-[#6E56CF] text-white'
                : 'text-[#8B8A85] hover:text-[#F1F0EE]'
            }`}
          >
            {toggleMonthly}
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              billing === 'yearly'
                ? 'bg-[#6E56CF] text-white'
                : 'text-[#8B8A85] hover:text-[#F1F0EE]'
            }`}
          >
            {toggleYearly}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              billing === 'yearly'
                ? 'bg-white/20 text-white'
                : 'bg-[#6E56CF]/20 text-[#a78bfa]'
            }`}>
              {proYearlySavings}
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const isPro = plan.highlight && !plan.coming
          const isAgency = plan.coming
          const displayPrice = isPro && billing === 'yearly' ? proYearlyPrice : plan.price
          const displayPeriod = isPro && billing === 'yearly' ? '/yr' : plan.period

          return (
            <div
              key={plan.nameKey}
              className={`relative flex flex-col items-center gap-3 px-5 py-5 pt-7 rounded-2xl border transition-colors ${
                isAgency
                  ? 'bg-[#161618] border-white/[0.04] opacity-60'
                  : isPro
                  ? 'bg-[#6E56CF]/[0.06] border-[#6E56CF]'
                  : 'bg-[#161618] border-white/[0.06] hover:border-white/[0.14]'
              }`}
            >
              {isPro && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {popularLabel}
                </div>
              )}
              {isAgency && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#232328] text-[#8B8A85] border border-white/[0.10] px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {comingSoonLabel}
                </div>
              )}

              <p className="text-[10px] text-[#5A5955] uppercase tracking-[0.15em] font-mono">{plan.nameKey}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-[34px] font-mono font-medium leading-none">{displayPrice}</span>
                {displayPeriod && <span className="text-[#8B8A85] text-sm">{displayPeriod}</span>}
              </div>

              {isAgency ? (
                <Link
                  href="/roadmap"
                  className="block w-full py-2 rounded-xl text-sm font-medium text-center bg-[#1E1E21] border border-white/[0.06] text-[#5A5955] hover:text-[#8B8A85] transition-colors"
                >
                  {comingSoonLabel} →
                </Link>
              ) : isPro ? (
                <>
                  <button
                    onClick={handleProCheckout}
                    disabled={loading}
                    className="block w-full py-2 rounded-xl text-sm font-medium text-center transition-colors bg-[#6E56CF] text-white hover:bg-[#7C68D4] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? '…' : plan.cta}
                  </button>
                  {displayPeriod && (
                    <p className="text-[11px] text-[#5A5955]">{cancelLabel}</p>
                  )}
                </>
              ) : (
                <Link
                  href="/"
                  className="block w-full py-2 rounded-xl text-sm font-medium text-center transition-colors bg-[#1E1E21] border border-white/[0.08] text-[#F1F0EE] hover:bg-[#232328]"
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
