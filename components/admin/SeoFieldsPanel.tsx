'use client'

interface SeoFieldsPanelProps {
  metaTitle: string
  metaDescription: string
  ogImageUrl: string
  onChange: (field: 'metaTitle' | 'metaDescription' | 'ogImageUrl', value: string) => void
}

export function SeoFieldsPanel({ metaTitle, metaDescription, ogImageUrl, onChange }: SeoFieldsPanelProps) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest">SEO</p>

      <div>
        <label className="block text-xs text-[#8B8A85] mb-1">Meta title</label>
        <input
          type="text"
          value={metaTitle}
          onChange={e => onChange('metaTitle', e.target.value)}
          placeholder="Auto from title if blank"
          maxLength={70}
          className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50"
        />
        <p className="text-[10px] text-[#3A3A3A] mt-1">{metaTitle.length}/70</p>
      </div>

      <div>
        <label className="block text-xs text-[#8B8A85] mb-1">Meta description</label>
        <textarea
          value={metaDescription}
          onChange={e => onChange('metaDescription', e.target.value)}
          placeholder="Auto from excerpt if blank"
          maxLength={165}
          rows={3}
          className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50 resize-none"
        />
        <p className="text-[10px] text-[#3A3A3A] mt-1">{metaDescription.length}/165</p>
      </div>

      <div>
        <label className="block text-xs text-[#8B8A85] mb-1">OG image URL</label>
        <input
          type="url"
          value={ogImageUrl}
          onChange={e => onChange('ogImageUrl', e.target.value)}
          placeholder="https://..."
          className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50"
        />
      </div>
    </div>
  )
}
