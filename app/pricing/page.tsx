import type { Metadata } from 'next'
import { PricingSection } from '@/components/landing/PricingSection'

export const metadata: Metadata = {
  title: 'ShipReady Pricing — Plans for Freelancers and Agencies',
  description: 'Free plan with 3 scans/month. Pro at $14/mo for unlimited scans and PDF reports. Agency at $39/mo for teams auditing client sites.',
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <PricingSection />
    </main>
  )
}
