'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { JSONContent } from '@tiptap/react'
import { TiptapEditor } from '@/components/admin/TiptapEditor'
import { SeoFieldsPanel } from '@/components/admin/SeoFieldsPanel'

interface BlogPost {
  id: string
  slug: string
  title: string
  content_json: JSONContent | null
  excerpt: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_url: string | null
  tags: string[]
  reading_time_minutes: number | null
  status: 'draft' | 'published'
  published_at: string | null
}

interface BlogEditorProps {
  post: BlogPost
  adminSecret: string
}

export function BlogEditor({ post, adminSecret }: BlogEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(post.title)
  const [slug, setSlug] = useState(post.slug)
  const [excerpt, setExcerpt] = useState(post.excerpt ?? '')
  const [tags, setTags] = useState((post.tags ?? []).join(', '))
  const [readingTime, setReadingTime] = useState(post.reading_time_minutes?.toString() ?? '')
  const [status, setStatus] = useState<'draft' | 'published'>(post.status)
  const [metaTitle, setMetaTitle] = useState(post.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(post.meta_description ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(post.og_image_url ?? '')
  const [content, setContent] = useState<JSONContent | null>(post.content_json)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async (patch: Record<string, unknown>) => {
    setSaving(true)
    try {
      await fetch(`/api/admin/blog/${post.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminSecret}`,
        },
        body: JSON.stringify(patch),
      })
      setLastSaved(new Date())
    } finally {
      setSaving(false)
    }
  }, [post.id, adminSecret])

  const saveAll = useCallback(() => {
    save({
      title,
      slug,
      excerpt: excerpt || null,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      reading_time_minutes: readingTime ? parseInt(readingTime, 10) : null,
      status,
      meta_title: metaTitle || null,
      meta_description: metaDescription || null,
      og_image_url: ogImageUrl || null,
      content_json: content,
    })
  }, [save, title, slug, excerpt, tags, readingTime, status, metaTitle, metaDescription, ogImageUrl, content])

  // Debounced autosave on content change
  const handleContentChange = useCallback((json: JSONContent) => {
    setContent(json)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      save({ content_json: json, updated_at: new Date().toISOString() })
    }, 3000)
  }, [save])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleSeoChange(field: 'metaTitle' | 'metaDescription' | 'ogImageUrl', value: string) {
    if (field === 'metaTitle') setMetaTitle(value)
    if (field === 'metaDescription') setMetaDescription(value)
    if (field === 'ogImageUrl') setOgImageUrl(value)
  }

  async function handleDelete() {
    if (!confirm('Delete this post? This cannot be undone.')) return
    await fetch(`/api/admin/blog/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminSecret}` },
    })
    router.push('/admin/blog')
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-[#0E0E0F]/95 backdrop-blur border-b border-white/[0.06]">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog" className="text-sm text-[#5A5955] hover:text-[#F1F0EE] transition-colors">← Blog</Link>
          <span className={`text-[10px] font-mono uppercase tracking-widest ${
            status === 'published' ? 'text-[#3DDC84]' : 'text-[#F5C518]'
          }`}>{status}</span>
          {saving && <span className="text-[10px] text-[#5A5955]">Saving...</span>}
          {lastSaved && !saving && (
            <span className="text-[10px] text-[#3A3A3A]">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/blog/${slug}?preview=true`}
            target="_blank"
            rel="noopener"
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors"
          >
            Preview
          </a>
          <button
            onClick={saveAll}
            disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-[#6E56CF] text-white text-sm font-medium hover:bg-[#7C68D4] transition-colors disabled:opacity-50"
          >
            Save
          </button>
        </div>
      </div>

      <div className="flex gap-0 max-w-screen-xl mx-auto">
        {/* Editor — left 65% */}
        <div className="flex-1 min-w-0 p-6">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Post title"
            className="w-full bg-transparent text-3xl font-semibold text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none mb-6 border-b border-white/[0.04] pb-4"
          />
          <TiptapEditor
            content={content}
            onChange={handleContentChange}
            placeholder="Write your post..."
            minHeight="500px"
          />
        </div>

        {/* Panels — right 35% */}
        <div className="w-80 shrink-0 border-l border-white/[0.06] p-5 space-y-5 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px)', position: 'sticky', top: '56px' }}>

          {/* Status */}
          <div>
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Status</p>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as 'draft' | 'published')}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Slug */}
          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={e => setSlug(e.target.value)}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm font-mono text-[#F1F0EE] focus:outline-none focus:border-[#6E56CF]/50"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="Short summary (shown in list)"
              rows={3}
              maxLength={300}
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50 resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="SEO, AI Visibility, Security"
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50"
            />
            <p className="text-[10px] text-[#3A3A3A] mt-1">Comma separated</p>
          </div>

          {/* Reading time */}
          <div>
            <label className="block text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-2">Reading time (minutes)</label>
            <input
              type="number"
              value={readingTime}
              onChange={e => setReadingTime(e.target.value)}
              min={1}
              placeholder="5"
              className="w-full bg-[#0E0E0F] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-[#F1F0EE] placeholder-[#3A3A3A] focus:outline-none focus:border-[#6E56CF]/50"
            />
          </div>

          {/* SEO */}
          <SeoFieldsPanel
            metaTitle={metaTitle}
            metaDescription={metaDescription}
            ogImageUrl={ogImageUrl}
            onChange={handleSeoChange}
          />

          {/* Danger */}
          <div className="pt-3 border-t border-white/[0.06]">
            <button
              onClick={handleDelete}
              className="text-xs text-[#5A5955] hover:text-red-400 transition-colors"
            >
              Delete post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
