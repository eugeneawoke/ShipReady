import { getUserWithPlan } from '@/lib/auth'
import { SiteHeader } from '@/components/SiteHeader'

export default async function PricingPage() {
  const user = await getUserWithPlan()
  const betaAccessHref = 'mailto:hi@shipready.app?subject=ShipReady%20beta%20access'

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: null,
      features: ['3 scans / month', 'All scores visible', 'AI fix prompts blurred'],
      cta: 'Get started',
      href: '/',
      highlight: false,
    },
    {
      name: 'Pro',
      price: '$14',
      period: '/mo',
      features: ['Unlimited scans', 'AI fix prompts for vibe-coding tools', 'PDF export', 'Weekly monitoring'],
      cta: 'Request beta access',
      href: betaAccessHref,
      highlight: true,
    },
    {
      name: 'Agency',
      price: '$39',
      period: '/mo',
      features: ['10 domains', 'White-label PDF', 'All Pro features', 'Priority support', 'Team seats (soon)'],
      cta: 'Contact us',
      href: betaAccessHref,
      highlight: false,
    },
  ]

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] px-6 py-24">
      <SiteHeader sticky />

      <div className="max-w-3xl mx-auto pt-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-medium">Simple, transparent pricing</h1>
          <p className="mt-3 text-[#8B8A85]">Start free. Upgrade when you need the full fix prompts.</p>
          {user?.plan && user.plan !== 'free' && (
            <p className="mt-2 text-sm text-[#3DDC84]">
              You are on the {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)} plan
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
                  Most popular
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
          Paid access is handled manually during beta &middot; Payment provider TBD
        </p>
      </div>
    </div>
  )
}
