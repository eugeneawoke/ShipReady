'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function ScanForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start scan')
      router.push(`/report/${data.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[560px] mx-auto">
      <div className="flex gap-2 h-[52px]">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://your-app.vercel.app"
          disabled={loading}
          className="flex-1 h-full px-4 rounded-lg font-mono text-sm bg-[#161618] border border-white/10 text-[#F1F0EE] placeholder:text-[#5A5955] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors"
        />
        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="px-6 h-full rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</>
          ) : (
            'Scan →'
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-[#FF4444]">{error}</p>
      )}
    </form>
  )
}
