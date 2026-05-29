'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface AdminBlogActionsProps {
  adminSecret: string
}

export function AdminBlogActions({ adminSecret }: AdminBlogActionsProps) {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  async function handleNew() {
    setCreating(true)
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify({ title: 'New Post' }),
      })
      if (!res.ok) throw new Error('Failed')
      const { post } = await res.json()
      router.push(`/admin/blog/${post.id}`)
    } catch {
      setCreating(false)
    }
  }

  return (
    <button
      onClick={handleNew}
      disabled={creating}
      className="px-4 py-2 rounded-xl bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors disabled:opacity-50"
    >
      {creating ? 'Creating...' : '+ New Post'}
    </button>
  )
}
