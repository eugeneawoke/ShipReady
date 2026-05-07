'use client'

import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { AnimatedShinyText } from '@/components/ui/animated-shiny-text'
import type { ComponentType } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponent = ComponentType<any>
const Meteors = dynamic(async () => { const m = await import('@/components/ui/meteors'); return m.Meteors as AnyComponent }, { ssr: false })

// ─── animation helpers ────────────────────────────────────────────────────────

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28, scale: 0.98 },
  whileInView: { opacity: 1, y: 0, scale: 1 },
  viewport: { once: true, amount: 0.05 },
  transition: { duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] as const },
})

// ─── inline icon ──────────────────────────────────────────────────────────────

const IconCheckCircle = ({ size = 14, color }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
)

// ─── smooth scroll helper (no-op on server) ───────────────────────────────────

function smoothScrollTo(selector: string) {
  if (typeof window === 'undefined') return
  const el = document.querySelector(selector)
  if (!el) return
  const NAV_H = 64
  const start = window.scrollY
  const end = el.getBoundingClientRect().top + window.scrollY - NAV_H
  const duration = 550
  const startTime = performance.now()
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
  function step(now: number) {
    const progress = Math.min((now - startTime) / duration, 1)
    window.scrollTo(0, start + (end - start) * easeOutCubic(progress))
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

// ─── component ────────────────────────────────────────────────────────────────

type Plan = {
  name: string
  nameKey: string
  price: string
  period: string | null
  desc: string
  features: string[]
  cta: string
  highlight: boolean
  coming: boolean
}

export function PricingSection() {
  const t = useTranslations('Landing.pricing')
  const plans = t.raw('plans') as Plan[]

  return (
    <section id="pricing" className="scroll-mt-24 py-24 px-6 bg-[#0E0E0F] text-[#F1F0EE]">
      <div className="max-w-4xl mx-auto">
        <motion.div {...fadeUp()} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-3">
            <AnimatedShinyText
              shimmerWidth={120}
              className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] font-mono"
            >
              {t('eyebrow')}
            </AnimatedShinyText>
          </div>
          <h2 className="text-[32px] font-semibold tracking-[-0.03em]">{t('title')}</h2>
          <p className="mt-3 text-[#8B8A85] text-sm">{t('sub')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-4 items-stretch" role="list">
          {plans.map((plan, i) => (
            <motion.div role="listitem"
              key={plan.nameKey}
              {...fadeUp(i * 0.1)}
              className={`relative flex flex-col p-6 rounded-2xl border ${
                plan.coming
                  ? 'bg-[#161618] border-white/[0.04] opacity-70'
                  : plan.highlight
                  ? 'bg-[#6E56CF]/[0.05] border-[#6E56CF] shadow-[0_0_60px_rgba(110,86,207,0.15)]'
                  : 'bg-[#161618] border-white/[0.06]'
              }`}
            >
              {/* Meteors for Pro card */}
              {plan.highlight && !plan.coming && (
                <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
                  <Meteors number={10} minDuration={6} maxDuration={14} className="text-[#a78bfa]/70" />
                </div>
              )}
              {plan.highlight && !plan.coming && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {t('popular')}
                </div>
              )}
              {plan.coming && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#232328] text-[#8B8A85] border border-white/[0.10] px-3 py-1 rounded-full uppercase tracking-[0.1em] whitespace-nowrap font-medium">
                  {t('comingSoon')}
                </div>
              )}
              <div className="mb-5">
                <p className="text-[10px] text-[#5A5955] uppercase tracking-[0.15em] font-mono mb-1">{plan.nameKey}</p>
                <p className="text-sm text-[#8B8A85] mb-4">{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-[38px] font-mono font-medium leading-none">{plan.price}</span>
                  {plan.period && <span className="text-[#8B8A85] text-sm">{plan.period}</span>}
                </div>
              </div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className={`text-sm flex items-center gap-2 ${plan.coming ? 'text-[#5A5955]' : plan.highlight ? 'text-[#F1F0EE]' : 'text-[#8B8A85]'}`}>
                    <span className="shrink-0">
                      <IconCheckCircle size={13} color={plan.coming ? '#3A3A3A' : '#3DDC84'} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              {plan.coming ? (
                <a
                  href="/roadmap"
                  className="block w-full py-2.5 rounded-xl text-sm font-medium text-center bg-[#1E1E21] border border-white/[0.06] text-[#5A5955] hover:text-[#8B8A85] hover:border-white/[0.10] transition-colors"
                >
                  {t('comingSoon')} →
                </a>
              ) : (
                <button
                  onClick={() => { if (!plan.highlight) smoothScrollTo('#cta') }}
                  className={`w-full py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    plan.highlight
                      ? 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
                      : 'bg-[#1E1E21] border border-white/[0.08] text-[#F1F0EE] hover:bg-[#232328]'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
              {!plan.coming && plan.period && (
                <p className="mt-2.5 text-center text-[11px] text-[#5A5955]">
                  {t('cancelAnytime')}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div {...fadeUp(0.3)} className="mt-8 text-center">
          <a
            href="/pricing"
            className="inline-flex items-center gap-2 text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors border border-white/[0.08] px-5 py-2.5 rounded-xl hover:border-white/[0.16]"
          >
            {t('comparePlans')} →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
