import Link from 'next/link'
import type { Metadata } from 'next'
import { getLocale, getMessages, getTranslations } from 'next-intl/server'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { ArrowLeft } from 'lucide-react'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { RoadmapMobileMenu } from '@/components/RoadmapMobileMenu'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'
import { RoadmapTabs } from '@/components/roadmap/RoadmapTabs'
import type { AppMessages } from '@/messages/en'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Metadata')
  return {
    title: t('roadmapTitle'),
    description: t('roadmapDescription'),
  }
}

type PhaseStatus = 'done' | 'in-progress' | 'planned'

export default async function RoadmapPage() {
  const locale = await getLocale()
  const messages = await getMessages() as AppMessages
  const t = messages.Roadmap
  const phases = t.phases as Array<{
    id: string
    title: string
    subtitle: string
    status: PhaseStatus
    releaseDate?: string
    items: string[]
  }>
  const statusMeta: Record<PhaseStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
    done: { label: t.statuses.done, color: '#3DDC84', Icon: CheckCircle2 },
    'in-progress': { label: t.statuses.inProgress, color: '#F5C518', Icon: Clock },
    planned: { label: t.statuses.planned, color: '#5A5955', Icon: Circle },
  }

  const navLabels = {
    howItWorks: messages.Landing.nav.howItWorks,
    seeReport: messages.Landing.nav.seeReport,
    whatWeCheck: messages.Landing.nav.whatWeCheck,
    faq: messages.Landing.nav.faq,
    pricing: messages.Landing.nav.pricing,
    methodology: messages.Landing.nav.methodology,
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        sticky
        right={(
          <div className="flex items-center gap-3">
            {/* Status legend — desktop only, would overflow on mobile */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-[#5A5955]">
              {(['done', 'in-progress', 'planned'] as PhaseStatus[]).map(s => {
                const { label, color, Icon } = statusMeta[s]
                return (
                  <span key={s} className="flex items-center gap-1.5">
                    <Icon className="w-3 h-3" style={{ color }} />
                    {label}
                  </span>
                )
              })}
            </div>
            {/* Hamburger — mobile only */}
            <RoadmapMobileMenu labels={navLabels} />
          </div>
        )}
      />

      <main className="max-w-3xl mx-auto px-6 py-12 pb-20 md:pb-16">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-[#8B8A85] transition-colors hover:text-[#F1F0EE] min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            <span>{locale === 'ru' ? 'Назад' : 'Back'}</span>
          </Link>
        </div>

        {/* Status legend — mobile (below Back, above title) */}
        <div className="flex sm:hidden items-center gap-4 text-xs text-[#5A5955] mb-6">
          {(['done', 'in-progress', 'planned'] as PhaseStatus[]).map(s => {
            const { label, color, Icon } = statusMeta[s]
            return (
              <span key={s} className="flex items-center gap-1.5">
                <Icon className="w-3 h-3" style={{ color }} />
                {label}
              </span>
            )
          })}
        </div>

        <div className="mb-14">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">{t.title}</p>
          <h1 className="text-[28px] sm:text-[36px] font-medium tracking-tight mb-3">{t.heading}</h1>
          <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg">
            {t.intro}{' '}
            {t.featureRequest}{' '}
            <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">{t.emailUs}</a>.
          </p>
        </div>

        <RoadmapTabs
          phases={phases}
          statusMeta={statusMeta}
          inProgressBadge={t.inProgressBadge}
          tabRoadmap={t.tabs.roadmap}
          tabWhatsNew={t.tabs.whatsNew}
          releasedLabel={t.changelog.released}
          emptyLabel={t.changelog.empty}
          locale={locale}
        />

        <div className="mt-14 p-6 rounded-2xl bg-[#161618] border border-white/[0.06] text-center">
          <p className="text-sm text-[#8B8A85] mb-4">
            {t.ctaBody}
          </p>
          <a
            href="mailto:egusakov74@gmail.com"
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            {t.cta}
          </a>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/#cta" pricingHref="/#pricing" />
    </div>
  )
}
