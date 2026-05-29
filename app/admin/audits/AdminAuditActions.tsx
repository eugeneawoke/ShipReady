'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function AdminAuditActions({ adminSecret }: { adminSecret: string }) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [open, setOpen] = useState(false)

  async function handleCreate() {
    if (!name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/admin/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminSecret}` },
        body: JSON.stringify({ company_name: name, company_website: website }),
      })
      if (!res.ok) throw new Error('Failed')
      const { audit } = await res.json()
      router.push(`/admin/audits/${audit.id}`)
    } catch {
      setCreating(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="px-4 py-2 rounded-xl bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors"
      >
        + New Audit
      </button>
      {open && (
        <div className="absolute right-0 top-11 w-72 p-4 rounded-xl bg-[#161618] border border-white/[0.08] z-10 space-y-3">
          <input
            autoFocus
            type="text"
            placeholder="Company name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none"
          />
          <input
            type="url"
            placeholder="https://company.com"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="w-full py-2 rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-50 transition-colors"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      )}
    </div>
  )
}
