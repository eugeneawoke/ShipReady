'use client'

import { useEffect, useState } from 'react'
import { WaitlistModal } from '@/components/WaitlistModal'

interface SlotData {
  total: number
  sold: number
  remaining: number
}

interface LtdSlots {
  pro: SlotData
  agency: SlotData
}

interface LtdFounderDealProps {
  active: boolean
  proCheckoutUrl?: string
  agencyCheckoutUrl?: string
}

export function LtdFounderDeal({ active, proCheckoutUrl, agencyCheckoutUrl }: LtdFounderDealProps) {
  const [slots, setSlots] = useState<LtdSlots | null>(null)
  const [waitlistOpen, setWaitlistOpen] = useState(false)

  useEffect(() => {
    if (!active) return
    fetch('/api/ltd-slots')
      .then(r => r.json())
      .then(setSlots)
      .catch(() => null)
  }, [active])

  return (
    <>
      <section className="mt-16 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-8">
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            Founder Deal
          </span>
          <h2 className="mt-2 text-2xl font-bold text-white">
            Invest in Glook — Own it forever
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            One-time payment. Same features as monthly. No renewals, ever.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <LtdCard
            tier="Pro Founder"
            price="$149"
            features={[
              'Everything in Pro',
              'Unlimited scans forever',
              'All AI fix prompts',
              'PDF export + weekly monitoring',
            ]}
            slots={slots?.pro ?? null}
            active={active}
            checkoutUrl={proCheckoutUrl}
            onWaitlist={() => setWaitlistOpen(true)}
          />
          <LtdCard
            tier="Agency Founder"
            price="$349"
            features={[
              'Everything in Agency',
              '10 monitored domains forever',
              'MCP Server for AI agents',
              'White-label PDF + API',
            ]}
            slots={slots?.agency ?? null}
            active={active}
            checkoutUrl={agencyCheckoutUrl}
            onWaitlist={() => setWaitlistOpen(true)}
          />
        </div>

        {!active && (
          <p className="mt-6 text-center text-sm text-zinc-500">
            Founder Deal activates at public launch.{' '}
            <button
              onClick={() => setWaitlistOpen(true)}
              className="text-amber-400 underline underline-offset-2 hover:text-amber-300 transition-colors"
            >
              Join the waitlist
            </button>{' '}
            to be notified.
          </p>
        )}
      </section>

      <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
    </>
  )
}

function LtdCard({
  tier,
  price,
  features,
  slots,
  active,
  checkoutUrl,
  onWaitlist,
}: {
  tier: string
  price: string
  features: string[]
  slots: SlotData | null
  active: boolean
  checkoutUrl?: string
  onWaitlist: () => void
}) {
  const remaining = slots?.remaining ?? null
  const pct = slots ? Math.round((slots.remaining / slots.total) * 100) : 100
  const soldOut = remaining === 0

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="font-semibold text-white">{tier}</p>
          <p className="text-3xl font-bold text-white">
            {price}{' '}
            <span className="text-sm font-normal text-zinc-400">one-time</span>
          </p>
        </div>
        {active && remaining !== null && (
          <div className="text-right">
            <p className="text-sm font-semibold text-amber-400">{remaining} / 100</p>
            <p className="text-xs text-zinc-500">slots left</p>
            <div className="mt-1 h-1.5 w-20 rounded-full bg-zinc-700">
              <div
                className="h-1.5 rounded-full bg-amber-400 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ul className="mb-5 space-y-1.5">
        {features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
            <span className="text-amber-400">✓</span> {f}
          </li>
        ))}
      </ul>

      {active ? (
        soldOut ? (
          <button
            onClick={onWaitlist}
            className="block w-full rounded-lg bg-amber-500 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            Join Waitlist
          </button>
        ) : (
          <a
            href={checkoutUrl ?? '#'}
            className="block w-full rounded-lg bg-amber-500 py-2.5 text-center text-sm font-semibold text-black transition hover:bg-amber-400"
          >
            {`Get ${tier} — ${price}`}
          </a>
        )
      ) : (
        <button
          disabled
          className="block w-full cursor-not-allowed rounded-lg bg-zinc-700 py-2.5 text-center text-sm font-semibold text-zinc-400"
        >
          Coming Soon
        </button>
      )}
    </div>
  )
}
