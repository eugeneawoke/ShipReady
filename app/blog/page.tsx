import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServiceClient } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog — ShipReady',
  description: 'Practical articles on SEO, AI visibility, web security, and site performance. Written for founders and developers.',
}

type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string | null
  tags: string[]
  reading_time_minutes: number | null
  og_image_url: string | null
  published_at: string
}

const TAG_FILTERS = ['SEO', 'AI Visibility', 'Security', 'Performance']

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams
  const tnav = await getTranslations('Landing.nav')

  let posts: BlogPost[] = []
  try {
    const supabase = createServiceClient()
    const query = supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, tags, reading_time_minutes, og_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    if (tag) {
      query.contains('tags', [tag])
    }

    const { data } = await query
    posts = data ?? []
  } catch {
    // supabase not configured locally — skip
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <SiteHeader
        sticky
        mobileNavItems={[
          { label: tnav('pricing'), href: '/pricing' },
          { label: tnav('roadmap'), href: '/roadmap' },
        ]}
      />

      <main className="max-w-3xl mx-auto px-6 py-16">
        <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">Blog</p>
        <h1 className="text-[28px] sm:text-[36px] font-medium tracking-tight mb-3">
          SEO, AI visibility, and security
        </h1>
        <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg mb-10">
          Practical guides for founders and developers building sites that get found — by Google and by AI.
        </p>

        {/* Tag filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/blog"
            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
              !tag ? 'bg-[#6E56CF] text-white' : 'bg-[#161618] text-[#8B8A85] border border-white/[0.06] hover:text-[#F1F0EE]'
            }`}
          >
            All
          </Link>
          {TAG_FILTERS.map(t => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                tag === t ? 'bg-[#6E56CF] text-white' : 'bg-[#161618] text-[#8B8A85] border border-white/[0.06] hover:text-[#F1F0EE]'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-[#5A5955]">
            <p className="text-sm">No posts yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block p-6 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="font-medium text-base text-[#F1F0EE] group-hover:text-white transition-colors">
                    {post.title}
                  </h2>
                  {post.reading_time_minutes && (
                    <span className="text-[10px] font-mono text-[#5A5955] shrink-0 mt-0.5">{post.reading_time_minutes} min</span>
                  )}
                </div>
                {post.excerpt && (
                  <p className="text-sm text-[#8B8A85] leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                )}
                <div className="flex items-center gap-3">
                  {(post.tags ?? []).map(t => (
                    <span key={t} className="text-[10px] font-mono text-[#6E56CF]">{t}</span>
                  ))}
                  {post.published_at && (
                    <span className="text-[10px] text-[#3A3A3A]">
                      {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
