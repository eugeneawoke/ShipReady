import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { AdminBlogActions } from './AdminBlogActions'

export const metadata: Metadata = {
  title: 'Blog Admin — Glook',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type BlogPost = {
  id: string
  slug: string
  title: string
  status: string
  published_at: string | null
  tags: string[]
  reading_time_minutes: number | null
  created_at: string
}

export default async function AdminBlogPage() {
  if (!process.env.ADMIN_SECRET) {
    redirect('/')
  }

  const supabase = createServiceClient()
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, status, published_at, tags, reading_time_minutes, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-mono text-[#6E56CF] uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl font-semibold">Blog Posts</h1>
          </div>
          <AdminBlogActions adminSecret={process.env.ADMIN_SECRET ?? ''} />
        </div>

        {!posts || posts.length === 0 ? (
          <div className="text-center py-20 text-[#5A5955]">
            <p className="text-sm">No posts yet. Create your first post above.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-[1fr_100px_120px_80px_64px] bg-[#161618] border-b border-white/[0.08] px-5 py-3 text-[10px] font-mono text-[#5A5955] uppercase tracking-widest">
              <span>Title</span>
              <span>Status</span>
              <span>Published</span>
              <span>Read</span>
              <span></span>
            </div>
            {(posts as BlogPost[]).map((post, i) => (
              <div
                key={post.id}
                className={`grid grid-cols-[1fr_100px_120px_80px_64px] px-5 py-3 items-center border-b border-white/[0.04] ${
                  i % 2 === 0 ? 'bg-[#0E0E0F]' : 'bg-[#111113]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-[#F1F0EE] truncate">{post.title}</p>
                  <p className="text-[10px] text-[#3A3A3A] font-mono">/blog/{post.slug}</p>
                </div>
                <span className={`text-[10px] font-mono uppercase tracking-wider ${
                  post.status === 'published' ? 'text-[#3DDC84]' : 'text-[#F5C518]'
                }`}>
                  {post.status}
                </span>
                <span className="text-xs text-[#5A5955]">
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                    : '—'}
                </span>
                <span className="text-xs text-[#5A5955]">
                  {post.reading_time_minutes ? `${post.reading_time_minutes}m` : '—'}
                </span>
                <Link
                  href={`/admin/blog/${post.id}`}
                  className="text-[10px] font-mono text-[#6E56CF] hover:text-[#a78bfa] transition-colors uppercase tracking-wider"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
