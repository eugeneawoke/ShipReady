'use client'

import { useState } from 'react'
import React from 'react'
import { useTranslations } from 'next-intl'
import { Zap, Search, Shield, Smartphone, Bot, ChevronDown } from 'lucide-react'
import type { CategoryScore, IssueCategory } from '@/types/scan'
import { getPassedChecksForIssues } from '@/lib/report/check-catalog'

const ICONS: Record<IssueCategory, React.ComponentType<{ className?: string }>> = {
  performance: Zap,
  seo: Search,
  security: Shield,
  mobile: Smartphone,
  ai_visibility: Bot,
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4444',
  high: '#FF8C42',
  medium: '#F5C518',
  low: '#4A9EFF',
}

interface CategoryCardProps {
  category: IssueCategory
  data: CategoryScore
}

export function CategoryCard({ category, data }: CategoryCardProps) {
  const t = useTranslations('CategoryCard')
  const [expanded, setExpanded] = useState(true)
  const [passedOpen, setPassedOpen] = useState(false)
  const Icon = ICONS[category]
  const labelColor =
    data.score === null ? '#8B8A85'
    : data.score >= 90 ? '#3DDC84'
    : data.score >= 70 ? '#7BC67E'
    : data.score >= 50 ? '#F5C518'
    : '#FF4444'

  const labelMap: Record<string, string> = {
    excellent: t('scoreLabels.excellent'),
    good: t('scoreLabels.good'),
    'needs-work': t('scoreLabels.needsWork'),
    poor: t('scoreLabels.poor'),
    unavailable: t('scoreLabels.unavailable'),
  }

  const passedChecks = getPassedChecksForIssues(category, data.issues)

  function scrollToIssue(issueId: string) {
    const el = document.getElementById(`issue-${issueId}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.style.transition = 'box-shadow 0.2s ease'
    el.style.boxShadow = '0 0 0 2px #6E56CF'
    setTimeout(() => { el.style.boxShadow = '' }, 1200)
  }

  return (
    <div className="category-card rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className="w-4 h-4 text-[#8B8A85] shrink-0 mt-0.5" />
        <div className="flex-1 text-left min-w-0">
          <span className="text-sm font-medium block">{t(`labels.${category}`)}</span>
          <span className="text-xs text-[#5A5955] leading-snug">{t(`descriptions.${category}`)}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:block w-24 h-1.5 bg-white/6 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.score ?? 0}%`, background: labelColor }}
            />
          </div>
          <span className="font-mono text-sm" style={{ color: labelColor }}>
            {data.score ?? '—'}
          </span>
          <span className="text-xs text-[#5A5955]">/100</span>
          <span className="text-xs text-[#8B8A85] hidden sm:inline">
            {labelMap[data.label]}
          </span>
          <ChevronDown
            className="w-4 h-4 text-[#5A5955] transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      {/* Issues list */}
      {expanded && (
        <div className="border-t border-white/6">
          {data.measurement && data.measurement.status !== 'measured' && (
            <div className="px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
              <p className="text-xs text-[#E8A83E]">
                {data.measurement.label}: {data.measurement.message || t('measurementFallback')}
              </p>
            </div>
          )}
          {data.issues.length === 0 ? (
            <div className="px-4 py-3 flex items-center gap-2">
              <span className={`text-xs ${data.measurement?.status === 'measured' ? 'text-[#3DDC84]' : 'text-[#E8A83E]'}`}>
                {data.measurement?.status === 'measured' ? '✓' : '!'}
              </span>
              <span className="text-sm text-[#8B8A85]">
                {data.measurement?.status === 'measured'
                  ? t('allPassed', { count: data.totalChecks })
                  : t('notMeasured')}
              </span>
            </div>
          ) : (
            <>
              {data.issues.map(issue => (
                <button
                  key={issue.id}
                  onClick={() => scrollToIssue(issue.id)}
                  className="w-full text-left px-4 py-3 border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ borderLeft: `2px solid ${SEVERITY_COLORS[issue.severity] || '#8B8A85'}` }}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.08em]"
                      style={{ color: SEVERITY_COLORS[issue.severity] || '#8B8A85' }}
                    >
                      {issue.severity}
                    </span>
                    {issue.confidence && (
                      <span className="text-[10px] font-mono text-[#5A5955] uppercase tracking-[0.08em]">
                        · {issue.confidence}
                      </span>
                    )}
                    {issue.value !== undefined && (
                      <span className="text-[10px] font-mono text-[#8B8A85]">· {issue.value}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#F1F0EE]">{issue.title}</p>
                  {issue.plainEnglish && (
                    <p className="text-xs text-[#5A5955] mt-1 leading-relaxed">{issue.plainEnglish}</p>
                  )}
                </button>
              ))}
            </>
          )}
          {data.measurement?.status === 'measured' && passedChecks.length > 0 && (
            <div className="border-t border-white/[0.04]">
              <button
                onClick={() => setPassedOpen(o => !o)}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <span className="text-[#3DDC84] text-[11px]">✓</span>
                <span className="text-xs text-[#5A5955] flex-1 text-left">
                  {t('passed', { count: passedChecks.length })}
                </span>
                <ChevronDown
                  className="w-3 h-3 text-[#5A5955] transition-transform duration-200"
                  style={{ transform: passedOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {passedOpen && (
                <div className="px-4 pb-3 space-y-1.5">
                  {passedChecks.map(check => (
                    <div key={check.id} className="flex items-start gap-2">
                      <span className="text-[#3DDC84] text-[10px] mt-0.5 shrink-0">✓</span>
                      <div>
                        <p className="text-xs text-[#8B8A85]">{check.name}</p>
                        <p className="text-[11px] text-[#5A5955] mt-0.5 leading-relaxed">{check.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
