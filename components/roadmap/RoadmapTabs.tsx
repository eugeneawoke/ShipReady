'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Clock } from 'lucide-react'
import { ChangelogView } from './ChangelogView'

type PhaseStatus = 'done' | 'in-progress' | 'planned'

interface RoadmapPhase {
  id: string
  title: string
  subtitle: string
  status: PhaseStatus
  releaseDate?: string
  items: string[]
}

interface StatusMeta {
  label: string
  color: string
  Icon: typeof CheckCircle2
}

interface RoadmapTabsProps {
  phases: RoadmapPhase[]
  statusMeta: Record<PhaseStatus, StatusMeta>
  inProgressBadge: string
  tabRoadmap: string
  tabWhatsNew: string
  releasedLabel: string
  emptyLabel: string
  locale: string
}

export function RoadmapTabs({
  phases,
  statusMeta,
  inProgressBadge,
  tabRoadmap,
  tabWhatsNew,
  releasedLabel,
  emptyLabel,
  locale,
}: RoadmapTabsProps) {
  const [activeTab, setActiveTab] = useState<'roadmap' | 'changelog'>('roadmap')

  return (
    <div>
      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-8 p-1 rounded-xl bg-[#161618] border border-white/[0.06] w-fit">
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'roadmap'
              ? 'bg-[#0E0E0F] text-[#F1F0EE] shadow-sm'
              : 'text-[#5A5955] hover:text-[#8B8A85]'
          }`}
        >
          {tabRoadmap}
        </button>
        <button
          onClick={() => setActiveTab('changelog')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'changelog'
              ? 'bg-[#0E0E0F] text-[#F1F0EE] shadow-sm'
              : 'text-[#5A5955] hover:text-[#8B8A85]'
          }`}
        >
          {tabWhatsNew}
        </button>
      </div>

      {/* Roadmap tab */}
      {activeTab === 'roadmap' && (
        <div className="relative">
          <div className="absolute left-[19px] top-3 bottom-3 w-px bg-gradient-to-b from-[#6E56CF]/40 via-white/[0.06] to-transparent" />
          <div className="space-y-8">
            {phases.map(phase => {
              const { color, Icon } = statusMeta[phase.status]
              return (
                <div key={phase.id} className="flex gap-6">
                  <div className="shrink-0 mt-1">
                    <Icon className="w-[38px] h-[38px] p-2 rounded-full bg-[#161618] border border-white/[0.06]" style={{ color }} />
                  </div>
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
                              {inProgressBadge}
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
      )}

      {/* Changelog tab */}
      {activeTab === 'changelog' && (
        <ChangelogView
          phases={phases}
          releasedLabel={releasedLabel}
          emptyLabel={emptyLabel}
          locale={locale}
        />
      )}
    </div>
  )
}
