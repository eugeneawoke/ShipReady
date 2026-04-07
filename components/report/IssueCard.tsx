'use client'

import type { Issue } from '@/types/scan'

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#FF4444',
  high: '#FF8C42',
  medium: '#F5C518',
  low: '#4A9EFF',
  pass: '#3DDC84',
}

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(255,68,68,0.08)',
  high: 'rgba(255,140,66,0.08)',
  medium: 'rgba(245,197,24,0.08)',
  low: 'rgba(74,158,255,0.08)',
  pass: 'rgba(61,220,132,0.08)',
}

interface IssueCardProps {
  issue: Issue
}

export function IssueCard({ issue }: IssueCardProps) {
  const color = SEVERITY_COLORS[issue.severity] || '#8B8A85'
  const bg = SEVERITY_BG[issue.severity] || 'transparent'

  return (
    <div
      className="rounded-r-xl py-3 px-4 space-y-2"
      style={{
        borderLeft: `2px solid ${color}`,
        background: bg,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.08em]"
              style={{ color }}
            >
              {issue.severity}
            </span>
            {issue.value !== undefined && (
              <span className="text-[10px] font-mono text-[#8B8A85]">· {issue.value}</span>
            )}
          </div>
          <p className="text-sm font-medium text-[#F1F0EE]">{issue.title}</p>
        </div>
      </div>

      <p className="text-sm text-[#8B8A85] leading-relaxed">{issue.plainEnglish}</p>

      {issue.docsUrl && (
        <a
          href={issue.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[11px] text-[#8B8A85] hover:text-[#6E56CF] transition-colors"
        >
          Docs →
        </a>
      )}
    </div>
  )
}
