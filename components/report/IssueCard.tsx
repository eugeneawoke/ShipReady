'use client'

import { useState } from 'react'
import { Check, Copy, ChevronDown, Lock } from 'lucide-react'
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

const CONFIDENCE_LABELS: Record<string, string> = {
  verified: 'Verified',
  likely: 'Likely',
  heuristic: 'Heuristic',
}

interface IssueCardProps {
  issue: Issue
  isPro: boolean
}

export function IssueCard({ issue, isPro }: IssueCardProps) {
  const [promptOpen, setPromptOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'technical' | 'vibe'>('technical')
  const [copied, setCopied] = useState(false)

  const color = SEVERITY_COLORS[issue.severity] || '#8B8A85'
  const bg = SEVERITY_BG[issue.severity] || 'transparent'

  const hasPrompts = !!(issue.cursorPrompt || issue.boltPrompt) && issue.severity !== 'pass'
  const currentPrompt = activeTab === 'technical'
    ? (issue.cursorPrompt || issue.boltPrompt || '')
    : (issue.boltPrompt || issue.cursorPrompt || '')

  function copy() {
    if (!currentPrompt) return
    navigator.clipboard.writeText(currentPrompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      id={`issue-${issue.id}`}
      className="group rounded-r-xl py-3 px-4 space-y-2"
      style={{ borderLeft: `2px solid ${color}`, background: bg }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-mono uppercase tracking-[0.08em]"
              style={{ color }}
            >
              {issue.severity}
            </span>
            {issue.confidence && (
              <span className="text-[10px] font-mono text-[#5A5955] uppercase tracking-[0.08em]">
                · {CONFIDENCE_LABELS[issue.confidence]}
              </span>
            )}
            {issue.value !== undefined && (
              <span className="text-[10px] font-mono text-[#8B8A85]">· {issue.value}</span>
            )}
          </div>
          <p className="text-sm font-medium text-[#F1F0EE]">{issue.title}</p>
        </div>
      </div>

      <p className="text-sm text-[#8B8A85] leading-relaxed">{issue.plainEnglish}</p>

      {issue.evidence && issue.evidence.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {issue.evidence.slice(0, 3).map((item, index) => (
            <span
              key={`${issue.id}-evidence-${index}`}
              className="text-[10px] font-mono text-[#8B8A85] rounded-full px-2 py-1 bg-white/[0.03] border border-white/[0.04]"
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      )}

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

      {/* Fix with AI — collapsible */}
      {hasPrompts && (
        <div className="print:hidden">
          <button
            onClick={() => setPromptOpen(o => !o)}
            className="flex items-center gap-1 cursor-pointer mt-1"
          >
            <span className="fix-ai-text text-xs">Fix with AI</span>
            <ChevronDown
              className="w-3 h-3 text-[#5A5955] group-hover:text-[#6E56CF] transition-colors duration-500 transition-transform duration-200"
              style={{ transform: promptOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>

          <div className={`issue-prompts ${promptOpen ? 'open' : ''}`}>
            <div className="pt-3 space-y-2">
              {/* Tabs */}
              <div className="flex border-b border-white/6">
                {(['technical', 'vibe'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-2.5 py-1.5 text-[11px] transition-colors relative cursor-pointer ${
                      activeTab === tab ? 'text-[#F1F0EE]' : 'text-[#5A5955] hover:text-[#8B8A85]'
                    }`}
                  >
                    {tab === 'technical' ? 'Technical (Cursor / Claude)' : 'Vibe (Bolt / Lovable)'}
                    {activeTab === tab && (
                      <span className="absolute bottom-0 left-0 right-0 h-[1px] bg-[#6E56CF]" />
                    )}
                  </button>
                ))}
              </div>

              {/* Prompt content */}
              {isPro ? (
                <div>
                  <pre className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-44">
                    {currentPrompt}
                  </pre>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors mt-2 cursor-pointer"
                  >
                    {copied
                      ? <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">Copied</span></>
                      : <><Copy className="w-3 h-3" />Copy</>
                    }
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <pre
                    className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-44 select-none"
                    style={{ filter: 'blur(5px)', userSelect: 'none' }}
                  >
                    {currentPrompt}
                  </pre>
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0E0E0F]/60 rounded-lg backdrop-blur-[2px]">
                    <div className="flex flex-col items-center gap-2">
                      <Lock className="w-4 h-4 text-[#8B8A85]" />
                      <a
                        href="/pricing"
                        className="text-xs text-white bg-[#6E56CF] hover:bg-[#7C68D4] px-3 py-1.5 rounded-md transition-colors"
                      >
                        Upgrade to Pro →
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
