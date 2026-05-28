// components/dashboard/ApiKeysList.tsx
'use client'

import { useState, useTransition } from 'react'
import { generateApiKey, deleteApiKey } from '@/app/dashboard/api/actions'
import { Copy, Check, Trash2, Plus } from 'lucide-react'

interface ApiKey {
  id: string
  label: string | null
  created_at: string
  calls_today: number
  daily_limit: number
  last_reset_at: string
}

export function ApiKeysList({ initialKeys }: { initialKeys: ApiKey[] }) {
  const [keys, setKeys] = useState(initialKeys)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleGenerate() {
    startTransition(async () => {
      setError(null)
      const result = await generateApiKey(label)
      if ('error' in result) {
        setError(result.error)
        return
      }
      setNewKey(result.plaintext)
      setLabel('')
      // Refresh keys list (re-fetch via server action would need router.refresh; use window.location for simplicity)
      window.location.reload()
    })
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this API key? This cannot be undone.')) return
    startTransition(async () => {
      await deleteApiKey(id)
      setKeys((prev) => prev.filter((k) => k.id !== id))
    })
  }

  return (
    <div className="space-y-6">
      {/* New key form */}
      <div className="rounded-xl border border-[#2A2A2A] bg-[#131312] p-5">
        <h2 className="mb-3 text-sm font-semibold">Generate new key</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Key label (optional)"
            className="flex-1 rounded-md border border-[#2A2A2A] bg-[#0E0E0D] px-3 py-2 text-sm text-[#F1F0EE] placeholder:text-[#8B8A85] focus:outline-none focus:ring-1 focus:ring-[#3DDC84]"
          />
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="flex items-center gap-2 rounded-md bg-[#3DDC84] px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Generate
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
      </div>

      {/* Newly generated key — show once */}
      {newKey && (
        <div className="rounded-xl border border-[#3DDC84]/30 bg-[#3DDC84]/5 p-5">
          <p className="mb-2 text-xs font-medium text-[#3DDC84]">
            ✅ Key generated — copy it now, it will not be shown again.
          </p>
          <div className="flex items-center gap-2 rounded-md bg-[#0E0E0D] px-3 py-2">
            <code className="flex-1 break-all text-xs text-[#F1F0EE]">{newKey}</code>
            <button
              onClick={() => handleCopy(newKey)}
              className="shrink-0 text-[#8B8A85] hover:text-[#F1F0EE]"
            >
              {copied ? <Check className="h-4 w-4 text-[#3DDC84]" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Existing keys */}
      {keys.length === 0 && !newKey ? (
        <p className="text-sm text-[#8B8A85]">No API keys yet. Generate one above.</p>
      ) : (
        <div className="space-y-2">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex items-center justify-between rounded-lg border border-[#2A2A2A] bg-[#131312] px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">{key.label ?? 'Unnamed key'}</p>
                <p className="mt-0.5 text-xs text-[#8B8A85]">
                  {key.calls_today}/{key.daily_limit} calls today · Created{' '}
                  {new Date(key.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(key.id)}
                disabled={isPending}
                className="text-[#8B8A85] transition-colors hover:text-red-400 disabled:opacity-50"
                aria-label="Delete key"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
