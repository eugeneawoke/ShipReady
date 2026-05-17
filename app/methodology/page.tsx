import Link from 'next/link'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  return {
    title: t('methodologyTitle'),
    description: t('methodologyDescription'),
  }
}

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  performance: { icon: '⚡', color: '#F5C518' },
  seo: { icon: '🔍', color: '#4A9EFF' },
  security: { icon: '🛡️', color: '#FF4444' },
  mobile: { icon: '📱', color: '#3DDC84' },
  ai: { icon: '🤖', color: '#A78BFA' },
  accessibility: { icon: '♿', color: '#FF9F43' },
}

const CATEGORY_KEYS = ['performance', 'seo', 'security', 'mobile', 'ai', 'accessibility'] as const
type CategoryKey = typeof CATEGORY_KEYS[number]

const CONFIDENCE_META: Record<string, { color: string; bg: string; border: string }> = {
  verified: { color: '#3DDC84', bg: 'rgba(61,220,132,0.08)', border: 'rgba(61,220,132,0.2)' },
  likely: { color: '#F5C518', bg: 'rgba(245,197,24,0.08)', border: 'rgba(245,197,24,0.2)' },
  heuristic: { color: '#8B8A85', bg: 'rgba(139,138,133,0.08)', border: 'rgba(139,138,133,0.2)' },
}

const CONFIDENCE_KEYS = ['verified', 'likely', 'heuristic'] as const
type ConfidenceKey = typeof CONFIDENCE_KEYS[number]

const MEASUREMENT_META: Record<string, { color: string }> = {
  measured: { color: '#3DDC84' },
  partial: { color: '#F5C518' },
  unavailable: { color: '#5A5955' },
}

const MEASUREMENT_KEYS = ['measured', 'partial', 'unavailable'] as const
type MeasurementKey = typeof MEASUREMENT_KEYS[number]

export default async function MethodologyPage() {
  const t = await getTranslations('Methodology')
  const tCommon = await getTranslations('Common')

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader sticky />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE]">
            <ArrowLeft className="h-4 w-4" />
            <span>{tCommon('back')}</span>
          </Link>
        </div>

        {/* Hero */}
        <div className="mb-16">
          <div className="inline-flex items-center gap-2 mb-4 text-[11px] font-mono uppercase tracking-[0.15em] text-[#6E56CF]">
            {t('eyebrow')}
          </div>
          <h1 className="text-[40px] font-semibold tracking-[-0.03em] leading-[1.05] mb-4">
            {t('title')}
          </h1>
          <p className="text-[#8B8A85] leading-relaxed text-base max-w-2xl">
            {t('subtitle')}
          </p>
        </div>

        {/* Categories */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">{t('categories.heading')}</h2>
          <div className="space-y-4">
            {CATEGORY_KEYS.map((key: CategoryKey) => {
              const meta = CATEGORY_META[key]
              return (
                <div
                  key={key}
                  className="rounded-2xl border border-white/[0.06] bg-[#161618] p-6"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xl">{meta.icon}</span>
                    <h3 className="font-semibold tracking-tight" style={{ color: meta.color }}>
                      {t(`categories.${key}.name` as `categories.${CategoryKey}.name`)}
                    </h3>
                  </div>
                  <p className="text-sm text-[#8B8A85] leading-relaxed">
                    {t(`categories.${key}.desc` as `categories.${CategoryKey}.desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Confidence model */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">{t('confidence.heading')}</h2>
          <p className="text-sm text-[#8B8A85] mb-6 leading-relaxed">
            {t('confidence.subtitle')}
          </p>
          <div className="space-y-3">
            {CONFIDENCE_KEYS.map((key: ConfidenceKey) => {
              const meta = CONFIDENCE_META[key]
              return (
                <div
                  key={key}
                  className="rounded-xl p-4 flex items-start gap-4"
                  style={{ background: meta.bg, border: `1px solid ${meta.border}` }}
                >
                  <span
                    className="shrink-0 mt-0.5 text-[11px] font-mono px-2 py-0.5 rounded-full font-medium"
                    style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}30` }}
                  >
                    {t(`confidence.${key}.label` as `confidence.${ConfidenceKey}.label`)}
                  </span>
                  <p className="text-sm text-[#8B8A85] leading-relaxed">
                    {t(`confidence.${key}.desc` as `confidence.${ConfidenceKey}.desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Scoring */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">{t('scoring.heading')}</h2>
          <p className="text-sm text-[#8B8A85] leading-relaxed mb-4">
            {t('scoring.intro')}
          </p>
          <div className="rounded-2xl border border-white/[0.06] bg-[#161618] p-6 space-y-3 text-sm text-[#8B8A85] leading-relaxed">
            <p>{t('scoring.detail')}</p>
            <p>
              {t('scoring.rangeGood')} <span className="text-[#7BC67E]">{t('scoring.good')}</span>.{' '}
              {t('scoring.rangeMid')} <span className="text-[#F5C518]">{t('scoring.needsWork')}</span>.{' '}
              {t('scoring.rangeLow')} <span className="text-[#FF4444]">{t('scoring.critical')}</span>.
            </p>
          </div>
        </section>

        {/* Measurement states */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-2 tracking-tight">{t('measurement.heading')}</h2>
          <p className="text-sm text-[#8B8A85] mb-6 leading-relaxed">
            {t('measurement.subtitle')}
          </p>
          <div className="space-y-3">
            {MEASUREMENT_KEYS.map((key: MeasurementKey) => {
              const meta = MEASUREMENT_META[key]
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/[0.06] bg-[#161618] p-4 flex items-start gap-4"
                >
                  <span
                    className="shrink-0 w-2 h-2 rounded-full mt-1.5"
                    style={{ background: meta.color }}
                  />
                  <div>
                    <p className="text-sm font-medium mb-1" style={{ color: meta.color }}>
                      {t(`measurement.${key}.label` as `measurement.${MeasurementKey}.label`)}
                    </p>
                    <p className="text-sm text-[#8B8A85] leading-relaxed">
                      {t(`measurement.${key}.desc` as `measurement.${MeasurementKey}.desc`)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        <div className="pt-4 border-t border-white/[0.06] text-sm text-[#5A5955]">
          {t('contact.question')}{' '}
          <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">
            {t('contact.link')}
          </a>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter />
    </div>
  )
}
