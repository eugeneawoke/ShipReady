import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'
import { getUserWithPlan } from '@/lib/auth'
import { BackButton } from '@/components/BackButton'
import { SiteHeader } from '@/components/SiteHeader'
import type { AppMessages } from '@/messages/en'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')

  return {
    title: t('pricingTitle'),
    description: t('pricingDescription'),
  }
}

export default async function PricingPage() {
  const t = await getTranslations('Pricing')
  const messages = await getMessages() as AppMessages
  const user = await getUserWithPlan()
  const betaAccessHref = 'mailto:hi@shipready.app?subject=ShipReady%20beta%20access'

  const plans = messages.Pricing.plans.map((plan, index) => ({
    ...plan,
    href: index === 0 ? '/' : betaAccessHref,
  }))

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] px-6 py-24">
      <SiteHeader sticky />

      <div className="max-w-3xl mx-auto pt-10">
        <div className="mb-8">
          <BackButton className="text-sm text-[#8B8A85] hover:text-[#F1F0EE]" />
        </div>
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium">{t('title')}</h1>
          <p className="mt-3 text-[#8B8A85]">{t('subtitle')}</p>
          {user?.plan && user.plan !== 'free' && (
            <p className="mt-2 text-sm text-[#3DDC84]">
              {t('currentPlan', {
                plan: user.plan === 'pro' ? 'Pro' : 'Agency',
              })}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative p-6 rounded-xl border ${
                plan.highlight
                  ? 'bg-[#161618] border-[#6E56CF]'
                  : 'bg-[#161618] border-white/6'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                  {t('popular')}
                </span>
              )}
              <p className="text-sm text-[#8B8A85]">{plan.name}</p>
              <p className="mt-2 text-3xl font-mono font-medium">
                {plan.price}
                {plan.period && <span className="text-base text-[#8B8A85] font-sans font-normal">{plan.period}</span>}
              </p>
              <ul className="mt-5 space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#8B8A85]">
                    <span className="text-[#3DDC84] shrink-0">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`block w-full text-center py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  plan.highlight
                    ? 'bg-[#6E56CF] text-white hover:bg-[#7C68D4]'
                    : 'bg-white/6 text-[#F1F0EE] hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <p className="text-center mt-8 text-xs text-[#5A5955]">
          {t('betaNote')}
        </p>
      </div>
    </div>
  )
}
