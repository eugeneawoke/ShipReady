import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase'
import { ContentPageHeader } from '@/components/navigation/ContentPageHeader'
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

const CATEGORIES = [
  { label: 'Latest', href: '/blog' },
  { label: 'SEO', href: '/blog?tag=SEO' },
  { label: 'AI Visibility', href: '/blog?tag=AI+Visibility' },
  { label: 'Security', href: '/blog?tag=Security' },
  { label: 'Performance', href: '/blog?tag=Performance' },
]

const TAG_GRADIENTS: Record<string, string> = {
  SEO: 'from-[#6E56CF] to-[#4A9EFF]',
  'AI Visibility': 'from-[#3DDC84] to-[#4A9EFF]',
  Security: 'from-[#FF4444] to-[#F5C518]',
  Performance: 'from-[#F5C518] to-[#3DDC84]',
  default: 'from-[#6E56CF] to-[#161618]',
}

function tagGradient(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_GRADIENTS[tag]) return TAG_GRADIENTS[tag]
  }
  return TAG_GRADIENTS.default
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const { tag } = await searchParams

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
    // supabase not configured locally
  }

  const activeHref = tag ? `/blog?tag=${encodeURIComponent(tag)}` : '/blog'

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      <ContentPageHeader activePath="/blog" />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex gap-10">

          {/* ── Left sidebar (desktop) ───────────────────────────────────── */}
          <aside className="hidden lg:block w-48 shrink-0">
            <div className="sticky top-24">
              <h1 className="text-2xl font-semibold mb-1">Blog</h1>
              <p className="text-xs text-[#8B8A85] leading-relaxed mb-8">
                Practical guides for founders and developers.
              </p>

              <nav className="space-y-1">
                {CATEGORIES.map(cat => {
                  const active = cat.href === activeHref
                  return (
                    <Link
                      key={cat.label}
                      href={cat.href}
                      className={`block py-1.5 text-sm transition-colors border-l-2 pl-3 ${
                        active
                          ? 'border-[#6E56CF] text-[#F1F0EE] font-medium'
                          : 'border-transparent text-[#8B8A85] hover:text-[#F1F0EE] hover:border-white/[0.2]'
                      }`}
                    >
                      {cat.label}
                    </Link>
                  )
                })}

                <div className="border-t border-white/[0.06] my-3" />

                <Link
                  href="/audits"
                  className="block py-1.5 text-sm text-[#8B8A85] hover:text-[#F1F0EE] border-l-2 border-transparent hover:border-white/[0.2] pl-3 transition-colors"
                >
                  Audit Reports
                </Link>
              </nav>
            </div>
          </aside>

          {/* ── Main content ─────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile category chips */}
            <div className="flex flex-wrap gap-2 mb-8 lg:hidden">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors ${
                    cat.href === activeHref
                      ? 'bg-[#6E56CF] text-white'
                      : 'bg-[#161618] text-[#8B8A85] border border-white/[0.06] hover:text-[#F1F0EE]'
                  }`}
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            {posts.length === 0 ? (
              <div className="text-center py-20 text-[#5A5955]">
                <p className="text-sm">No posts yet. Check back soon.</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {posts.map(post => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Cover image */}
                    <div className="relative h-44 w-full overflow-hidden shrink-0">
                      {post.og_image_url ? (
                        <Image
                          src={post.og_image_url}
                          alt={post.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${tagGradient(post.tags ?? [])} opacity-40`} />
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      {(post.tags ?? []).length > 0 && (
                        <span className="text-[10px] font-mono text-[#6E56CF] mb-2">{post.tags[0]}</span>
                      )}
                      <h2 className="font-medium text-base text-[#F1F0EE] group-hover:text-white transition-colors mb-2 leading-snug">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-[#8B8A85] leading-relaxed line-clamp-2 flex-1">{post.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        {post.reading_time_minutes && (
                          <span className="text-[10px] font-mono text-[#5A5955]">{post.reading_time_minutes} min</span>
                        )}
                        {post.published_at && (
                          <span className="text-[10px] text-[#3A3A3A]">
                            {new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
