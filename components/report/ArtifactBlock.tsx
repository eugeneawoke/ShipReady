'use client'
import { useState } from 'react'

interface Props {
  title: string
  content: string
  filename?: string
  language?: string
}

export function ArtifactBlock({ title, content, filename, language = 'text' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  void language // reserved for future syntax highlighting

  return (
    <div className="mt-3 rounded-xl border border-white/[0.08] bg-[#0E0E0F] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8B8A85]">{title}</span>
          {filename && (
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px] text-[#8B8A85]">{filename}</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs text-[#8B8A85] transition-colors hover:text-[#F1F0EE] cursor-pointer"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-[#C1C0BA]">
        <code>{content}</code>
      </pre>
    </div>
  )
}
