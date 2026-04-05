import { ScanForm } from '@/components/landing/ScanForm'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/6 bg-[#0E0E0F]/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="font-semibold tracking-tight">ShipReady</span>
          <div className="flex items-center gap-4">
            <button className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">EN</button>
            <span className="text-[#5A5955]">/</span>
            <button className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">RU</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-[120px] pb-24 px-6 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-[48px] font-medium leading-tight tracking-tight">
            Pre-deploy quality gate
            <span className="block text-[#8B8A85]">for vibe-coded apps</span>
          </h1>
          <p className="mt-4 text-lg text-[#8B8A85]">
            25+ checks · 30 seconds · AI fix prompts for Cursor & Bolt
          </p>

          <div className="mt-10">
            <ScanForm />
          </div>

          {/* Platform badges */}
          <div className="mt-8 flex items-center justify-center gap-6">
            {['Cursor', 'Bolt', 'Lovable', 'v0', 'Replit'].map(p => (
              <span key={p} className="text-sm text-[#5A5955] grayscale opacity-40 hover:opacity-60 transition-opacity">
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Performance', desc: 'Core Web Vitals, LCP, CLS, INP via Lighthouse', color: '#FF8C42' },
            { label: 'Security', desc: '11 security checks: headers, SSL, exposed keys', color: '#FF4444' },
            { label: 'SEO & Social', desc: 'OG tags, meta, canonical, social previews', color: '#4A9EFF' },
          ].map(f => (
            <div key={f.label} className="p-5 rounded-xl bg-[#161618] border border-white/6 text-left">
              <div className="w-2 h-2 rounded-full mb-3" style={{ background: f.color }} />
              <p className="font-medium text-sm">{f.label}</p>
              <p className="mt-1 text-xs text-[#8B8A85]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-medium mb-8">Simple pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Free', price: '$0', features: ['3 scans/month', 'All scores visible', 'AI prompts blurred'], highlight: false },
              { name: 'Pro', price: '$14', period: '/mo', features: ['Unlimited scans', 'AI fix prompts', 'PDF export', 'Weekly monitoring'], highlight: true },
              { name: 'Agency', price: '$39', period: '/mo', features: ['10 domains', 'White-label PDF', 'All Pro features', 'Priority support'], highlight: false },
            ].map(plan => (
              <div
                key={plan.name}
                className={`p-6 rounded-xl border text-left relative ${
                  plan.highlight
                    ? 'bg-[#161618] border-[#6E56CF]'
                    : 'bg-[#161618] border-white/6'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] bg-[#6E56CF] text-white px-3 py-1 rounded-full uppercase tracking-widest">
                    Most popular
                  </span>
                )}
                <p className="text-sm text-[#8B8A85]">{plan.name}</p>
                <p className="mt-2 text-3xl font-mono font-medium">
                  {plan.price}
                  {plan.period && <span className="text-base text-[#8B8A85] font-sans">{plan.period}</span>}
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm text-[#8B8A85] flex items-center gap-2">
                      <span className="text-[#3DDC84]">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
