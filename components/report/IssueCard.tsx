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

interface IssueCardProps {
  issue: Issue
  isPro?: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
    >
      {copied ? (
        <><Check className="w-3 h-3 text-[#3DDC84]" /><span className="text-[#3DDC84]">Copied</span></>
      ) : (
        <><Copy className="w-3 h-3" />Copy prompt</>
      )}
    </button>
  )
}

function PromptBlock({ label, prompt, isPro }: { label: string; prompt: string; isPro: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
      >
        <ChevronDown
          className="w-3 h-3 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
        {label}
      </button>

      {open && (
        <div className="mt-2 relative">
          {isPro ? (
            <>
              <pre className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono">
                {prompt}
              </pre>
              <div className="mt-1.5">
                <CopyButton text={prompt} />
              </div>
            </>
          ) : (
            <div className="relative">
              <pre
                className="text-xs text-[#E8C77D] bg-[#1E1E21] rounded-lg p-3 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono select-none"
                style={{ filter: 'blur(5px)', userSelect: 'none' }}
              >
                {prompt}
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
      )}
    </div>
  )
}

export function IssueCard({ issue, isPro = false }: IssueCardProps) {
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
      {/* Header */}
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

      {/* Plain English explanation */}
      <p className="text-sm text-[#8B8A85] leading-relaxed">{issue.plainEnglish}</p>

      {/* Prompts */}
      {(issue.cursorPrompt || issue.boltPrompt) && (
        <div className="space-y-2 pt-1">
          {issue.cursorPrompt && (
            <PromptBlock label="Fix with Cursor ▾" prompt={issue.cursorPrompt} isPro={isPro} />
          )}
          {issue.boltPrompt && (
            <PromptBlock label="Fix with Bolt ▾" prompt={issue.boltPrompt} isPro={isPro} />
          )}
        </div>
      )}

      {/* Docs link */}
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
