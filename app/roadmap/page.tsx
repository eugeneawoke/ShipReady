import type { Metadata } from 'next'
import { getMessages, getTranslations } from 'next-intl/server'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { BackButton } from '@/components/BackButton'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
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
  const messages = await getMessages() as AppMessages
  const t = messages.Roadmap
  const phases = t.phases as Array<{
    id: string
    title: string
    subtitle: string
    status: PhaseStatus
    items: string[]
  }>
  const statusMeta: Record<PhaseStatus, { label: string; color: string; Icon: typeof CheckCircle2 }> = {
    done: { label: t.statuses.done, color: '#3DDC84', Icon: CheckCircle2 },
    'in-progress': { label: t.statuses.inProgress, color: '#F5C518', Icon: Clock },
    planned: { label: t.statuses.planned, color: '#5A5955', Icon: Circle },
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        maxWidthClassName="max-w-4xl"
        right={(
          <div className="flex items-center gap-4 text-xs text-[#5A5955]">
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
        )}
      />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-8">
          <BackButton className="text-sm text-[#8B8A85] hover:text-[#F1F0EE]" />
        </div>
        <div className="mb-14">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">{t.title}</p>
          <h1 className="text-[36px] font-medium tracking-tight mb-3">{t.heading}</h1>
          <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg">
            {t.intro}{' '}
            {t.featureRequest}{' '}
            <a href="mailto:hi@shipready.app" className="text-[#6E56CF] hover:underline">{t.emailUs}</a>.
          </p>
        </div>

        <div className="relative">
          {/* vertical timeline line */}
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-[#6E56CF]/40 via-white/[0.06] to-transparent" />

          <div className="space-y-8">
            {phases.map(phase => {
              const { color, Icon } = statusMeta[phase.status]
              return (
                <div key={phase.id} className="flex gap-6">
                  {/* dot */}
                  <div className="shrink-0 mt-1">
                    <Icon className="w-[38px] h-[38px] p-2 rounded-full bg-[#161618] border border-white/[0.06]" style={{ color }} />
                  </div>

                  {/* card */}
                  <div className={`flex-1 p-5 rounded-2xl border ${
                    phase.status === 'in-progress'
                      ? 'bg-[#6E56CF]/[0.04] border-[#6E56CF]/30'
                      : 'bg-[#161618] border-white/[0.06]'
                  }`}>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-[#5A5955] tracking-widest">{phase.id}</span>
                          {phase.status === 'in-progress' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C518]/10 text-[#F5C518] font-mono border border-[#F5C518]/20">
                              {t.inProgressBadge}
                            </span>
                          )}
                        </div>
                        <h2 className="font-medium text-base">{phase.title}</h2>
                        <p className="text-xs text-[#5A5955] mt-0.5">{phase.subtitle}</p>
                      </div>
                    </div>

                    <ul className="space-y-1.5">
                      {phase.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-[#8B8A85]">
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0 mt-0.5"
                            style={{ color: phase.status === 'done' ? '#3DDC84' : phase.status === 'in-progress' ? '#F5C518' : '#3A3A3A' }}
                          />
                          <span className={phase.status === 'planned' ? 'opacity-50' : ''}>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mt-14 p-6 rounded-2xl bg-[#161618] border border-white/[0.06] text-center">
          <p className="text-sm text-[#8B8A85] mb-4">
            {t.ctaBody}
          </p>
          <a
            href="mailto:hi@shipready.app"
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            {t.cta}
          </a>
        </div>
      </main>

      <CinematicFooter scanHref="/#cta" pricingHref="/#pricing" />
    </div>
  )
}
