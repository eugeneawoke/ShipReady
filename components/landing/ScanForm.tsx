'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const FRIENDLY_ERRORS: Record<string, string> = {
  'Forbidden':             'Something went wrong on our end.',
  'Failed to create scan': 'Could not start the scan. Please try again.',
  'Invalid URL':           'Please enter a valid URL (e.g. https://yoursite.com)',
  'Rate limit exceeded. Sign in for more scans.': 'Hourly limit reached. Sign in for more scans.',
  'Free limit reached':    "You've used all 3 free scans this month.",
}

function friendlyMessage(raw: string): string {
  return FRIENDLY_ERRORS[raw] ?? raw
}

export function ScanForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ msg: string; showContact: boolean } | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        const raw = data.error || 'Something went wrong'
        const msg = friendlyMessage(raw)
        // Show contact for unexpected server errors (5xx or unknown)
        const showContact = res.status >= 500 || raw === 'Forbidden' || raw === 'Failed to create scan'
        setError({ msg, showContact })
        setLoading(false)
        return
      }
      router.push(`/report/${data.id}`)
    } catch {
      setError({ msg: 'Could not reach the server. Please check your connection.', showContact: true })
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
          placeholder="https://yoursite.com"
          disabled={loading}
          className="flex-1 h-full px-4 rounded-lg font-mono text-base sm:text-sm bg-[#161618] border border-white/10 text-[#F1F0EE] placeholder:text-[#5A5955] focus:outline-none focus:border-white/20 disabled:opacity-50 transition-colors"
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
        <div className="mt-2 text-sm text-[#FF4444] space-y-0.5">
          <p>{error.msg}</p>
          {error.showContact && (
            <p className="text-[#8B8A85] text-xs">
              If the problem persists, contact me:{' '}
              <a href="https://t.me/eugenegusakov" target="_blank" rel="noopener noreferrer" className="text-[#6E56CF] hover:underline">Telegram</a>
              {' '}or{' '}
              <a href="mailto:egusakov74@gmail.com" className="text-[#6E56CF] hover:underline">Email</a>
            </p>
          )}
        </div>
      )}
    </form>
  )
}
