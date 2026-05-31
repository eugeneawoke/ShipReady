'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JSONContent } from '@tiptap/react'
import { TiptapEditor } from '@/components/admin/TiptapEditor'
import { SeoFieldsPanel } from '@/components/admin/SeoFieldsPanel'
import type { ScanResult } from '@/types/scan'

interface AuditReport {
  id: string
  slug: string
  company_name: string
  company_website: string
  scan_id: string | null
  editorial_json: JSONContent | null
  editorial_summary: string | null
  og_image_url: string | null
  status: 'draft' | 'published'
  published_at: string | null
}

interface ScanRow {
  result: ScanResult | null
  url: string
  created_at: string
}

interface ScanSearchResult {
  id: string
  url: string
  created_at: string
  score: number | null
}

interface AuditEditorProps {
  audit: AuditReport
  scanResult: ScanRow | null
  adminSecret: string
}

export function AuditEditor({ audit, scanResult, adminSecret }: AuditEditorProps) {
  const router = useRouter()
  const [companyName, setCompanyName] = useState(audit.company_name)
  const [companyWebsite, setCompanyWebsite] = useState(audit.company_website)
  const [slug, setSlug] = useState(audit.slug)
  const [status, setStatus] = useState<'draft' | 'published'>(audit.status)
  const [editorialSummary, setEditorialSummary] = useState(audit.editorial_summary ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(audit.og_image_url ?? '')
  const [content, setContent] = useState<JSONContent | null>(audit.editorial_json)
  const [scanId, setScanId] = useState<string | null>(audit.scan_id)
  const [scanSearch, setScanSearch] = useState('')
  const [scanResults, setScanResults] = useState<ScanSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch(`/api/admin/audits/${audit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify(patch),
      })
      setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [audit.id, adminSecret])

  const saveAll = useCallback(() => {
    save({
      company_name: companyName,
      company_website: companyWebsite,
      slug,
      status,
      scan_id: scanId,
      editorial_summary: editorialSummary || null,
      og_image_url: ogImageUrl || null,
      editorial_json: content,
    })
  }, [save, companyName, companyWebsite, slug, status, scanId, editorialSummary, ogImageUrl, content])

  const handleContentChange = useCallback((json: JSONContent) => {
    setContent(json)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save({ editorial_json: json })
    }, 3000)
  }, [save])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  async function handleScanSearch() {
    if (!scanSearch.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/admin/audits/scan-search?domain=${encodeURIComponent(scanSearch)}`, {
        headers: { Authorization: `Bearer ${adminSecret}` },
      })
      const { scans } = await res.json()
      setScanResults(scans ?? [])
    } finally {
      setSearching(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this audit report?')) return
    await fetch(`/api/admin/audits/${audit.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminSecret}` },
    })
    router.push('/admin/audits')
  }

  const currentScan = scanResult

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-[#0E0E0F]/95 backdrop-blur border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <Link href="/admin/audits" className="text-sm text-[#5A5955] hover:text-[#F1F0EE] transition-colors">← Audits</Link>
          <span className={`text-[10px] font-mono uppercase ${status === 'published' ? 'text-[#3DDC84]' : 'text-[#F5C518]'}`}>{status}</span>
          {saving && <span className="text-[10px] text-[#5A5955]">Saving...</span>}
          {lastSaved && !saving && <span className="text-[10px] text-[#3A3A3A]">Saved {lastSaved.toLocaleTimeString()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <a href={`/audits/${slug}?preview=true`} target="_blank" rel="noopener"
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">
            Preview
          </a>
          <button onClick={saveAll} disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-50 transition-colors">
            Save
          </button>
        </div>
      </div>

      <div className="flex max-w-screen-xl mx-auto">
        {/* Editor left */}
        <div className="flex-1 min-w-0 p-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
              placeholder="Company name"
              className="bg-transparent text-xl font-semibold text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none border-b border-white/[0.04] pb-2" />
            <input type="url" value={companyWebsite} onChange={e => setCompanyWebsite(e.target.value)}
              placeholder="https://company.com"
              className="bg-transparent text-sm text-[#8B8A85] placeholder-[#3A3A3A] focus:outline-none border-b border-white/[0.04] pb-2" />
          </div>

          {/* Scan search */}
          <div className="mb-6 p-4 rounded-xl bg-[#161618] border border-white/[0.06]">
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-3">Link to scan</p>
            {currentScan && scanId && (
              <div className="mb-3 p-3 rounded-lg bg-[#6E56CF]/[0.08] border border-[#6E56CF]/20 text-sm">
                <p className="text-[#F1F0EE] text-xs">{currentScan.url}</p>
                <p className="text-[10px] text-[#5A5955] mt-0.5">
                  {new Date(currentScan.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  {' · '}Score: {(currentScan.result as ScanResult | null)?.totalScore ?? '—'}
                </p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={scanSearch}
                onChange={e => setScanSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScanSearch()}
                placeholder="Search by domain…"
                className="flex-1 bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none"
              />
              <button onClick={handleScanSearch} disabled={searching}
                className="px-3 py-2 rounded-lg bg-[#161618] border border-white/[0.08] text-sm text-[#8B8A85] hover:text-[#F1F0EE] disabled:opacity-50 transition-colors">
                {searching ? '…' : 'Search'}
              </button>
            </div>
            {scanResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {scanResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setScanId(s.id); setScanResults([]) }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      scanId === s.id ? 'bg-[#6E56CF]/20 text-[#F1F0EE]' : 'hover:bg-white/[0.04] text-[#8B8A85]'
                    }`}
                  >
                    <span className="font-mono">{s.url}</span>
                    <span className="ml-2 text-[#5A5955]">Score: {s.score ?? '—'}</span>
                    <span className="ml-2 text-[#3A3A3A]">{new Date(s.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-3">Editorial commentary</p>
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Write your editorial analysis..."
            minHeight="400px"
          />
        </div>

        {/* Right panels */}
        <div className="w-80 shrink-0 border-l border-white/[0.06] p-5 space-y-5 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 56px)', position: 'sticky', top: '56px' }}>

          <div>
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Status</p>
            <select value={status} onChange={e => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] focus:outline-none">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Slug</label>
            <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono text-[#F1F0EE] focus:outline-none focus:border-[#6E56CF]/50" />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Editorial summary</label>
            <textarea value={editorialSummary} onChange={e => setEditorialSummary(e.target.value)}
              placeholder="Short summary shown on list page"
              rows={3} maxLength={300}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none resize-none" />
          </div>

          <SeoFieldsPanel
            metaTitle=""
            metaDescription=""
            ogImageUrl={ogImageUrl}
            onChange={(field, value) => { if (field === 'ogImageUrl') setOgImageUrl(value) }}
          />

          <div className="pt-3 border-t border-white/[0.06]">
            <button onClick={handleDelete} className="text-xs text-[#5A5955] hover:text-red-400 transition-colors">
              Delete audit report
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
