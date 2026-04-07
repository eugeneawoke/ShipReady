'use client'

import { useState } from 'react'
import React from 'react'
import { Zap, Search, Shield, Smartphone, Bot, ChevronDown } from 'lucide-react'
import type { CategoryScore, IssueCategory } from '@/types/scan'

const ICONS: Record<IssueCategory, React.ComponentType<{ className?: string }>> = {
  performance: Zap,
  seo: Search,
  security: Shield,
  mobile: Smartphone,
  ai_visibility: Bot,
}

const LABELS: Record<IssueCategory, string> = {
  performance: 'Performance',
  seo: 'SEO & Social',
  security: 'Security',
  mobile: 'Mobile',
  ai_visibility: 'AI Visibility',
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
  const [expanded, setExpanded] = useState(true)
  const Icon = ICONS[category]
  const labelColor =
    data.score >= 90
      ? '#3DDC84'
      : data.score >= 70
      ? '#7BC67E'
      : data.score >= 50
      ? '#F5C518'
      : '#FF4444'

  const labelMap: Record<string, string> = {
    excellent: 'Excellent',
    good: 'Good',
    'needs-work': 'Needs work',
    poor: 'Poor',
  }

  return (
    <div className="category-card rounded-xl bg-[#161618] border border-white/6 overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 p-4 hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <Icon className="w-4 h-4 text-[#8B8A85] shrink-0" />
        <span className="flex-1 text-sm font-medium text-left">{LABELS[category]}</span>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="hidden sm:block w-24 h-1.5 bg-white/6 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${data.score}%`, background: labelColor }}
            />
          </div>
          <span className="font-mono text-sm" style={{ color: labelColor }}>
            {data.score}
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
          {data.issues.length === 0 ? (
            <div className="px-4 py-3 flex items-center gap-2">
              <span className="text-[#3DDC84] text-xs">✓</span>
              <span className="text-sm text-[#8B8A85]">
                All {data.totalChecks} checks passed
              </span>
            </div>
          ) : (
            <>
              {data.issues.map(issue => (
                <div
                  key={issue.id}
                  className="px-4 py-3 border-b border-white/[0.04] last:border-0 flex items-start gap-3"
                  style={{
                    borderLeft: `2px solid ${SEVERITY_COLORS[issue.severity] || '#8B8A85'}`,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[10px] font-mono uppercase tracking-[0.08em]"
                        style={{ color: SEVERITY_COLORS[issue.severity] || '#8B8A85' }}
                      >
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-sm text-[#F1F0EE]">{issue.title}</p>
                    {issue.value && (
                      <p className="text-xs font-mono text-[#8B8A85] mt-0.5">{issue.value}</p>
                    )}
                  </div>
                </div>
              ))}
              {data.passedChecks > 0 && (
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="text-[#3DDC84] text-xs">✓</span>
                  <span className="text-xs text-[#5A5955]">
                    {data.passedChecks} checks passed
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
