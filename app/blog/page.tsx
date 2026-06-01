import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase'
import { ContentPageHeader } from '@/components/navigation/ContentPageHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'
import { ChangelogFeed } from '@/components/blog/ChangelogFeed'

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

type AuditReport = {
  id: string
  slug: string
  company_name: string
  company_website: string
  editorial_summary: string | null
  og_image_url: string | null
  published_at: string
}

// Unified card shape
type ContentCard = {
  id: string
  href: string
  title: string
  excerpt: string | null
  tags: string[]
  og_image_url: string | null
  published_at: string
  reading_time_minutes?: number | null
  badge?: string
}

const CATEGORIES = [
  { label: 'Latest',        href: '/blog',                      param: null },
  { label: 'SEO',           href: '/blog?tag=SEO',              param: 'SEO' },
  { label: 'AI Visibility', href: '/blog?tag=AI+Visibility',    param: 'AI Visibility' },
  { label: 'Security',      href: '/blog?tag=Security',         param: 'Security' },
  { label: 'Performance',   href: '/blog?tag=Performance',      param: 'Performance' },
  { label: 'Audit Reports', href: '/blog?category=audits',      param: 'audits' },
  { label: 'Changelog',     href: '/blog?category=changelog',   param: 'changelog' },
]

const TAG_GRADIENTS: Record<string, string> = {
  SEO: 'from-[#6E56CF] to-[#4A9EFF]',
  'AI Visibility': 'from-[#3DDC84] to-[#4A9EFF]',
  Security: 'from-[#FF4444] to-[#F5C518]',
  Performance: 'from-[#F5C518] to-[#3DDC84]',
  audits: 'from-[#6E56CF] to-[#3DDC84]',
  default: 'from-[#6E56CF] to-[#161618]',
}

function tagGradient(tags: string[]): string {
  for (const tag of tags) {
    if (TAG_GRADIENTS[tag]) return TAG_GRADIENTS[tag]
  }
  return TAG_GRADIENTS.default
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ tag?: string; category?: string }> }) {
  const { tag, category } = await searchParams
  const isAudits = category === 'audits'
  const isChangelog = category === 'changelog'

  let cards: ContentCard[] = []

  try {
    const supabase = createServiceClient()

    if (isAudits) {
      // Fetch audit reports
      const { data } = await supabase
        .from('audit_reports')
        .select('id, slug, company_name, company_website, editorial_summary, og_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      cards = ((data ?? []) as AuditReport[]).map(r => ({
        id: r.id,
        href: `/audits/${r.slug}`,
        title: r.company_name,
        excerpt: r.editorial_summary,
        tags: [r.company_website],
        og_image_url: r.og_image_url,
        published_at: r.published_at,
        badge: 'Audit Report',
      }))
    } else {
      // Fetch blog posts
      const query = supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, tags, reading_time_minutes, og_image_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (tag) query.contains('tags', [tag])

      const { data } = await query
      cards = ((data ?? []) as BlogPost[]).map(p => ({
        id: p.id,
        href: `/blog/${p.slug}`,
        title: p.title,
        excerpt: p.excerpt,
        tags: p.tags ?? [],
        og_image_url: p.og_image_url,
        published_at: p.published_at,
        reading_time_minutes: p.reading_time_minutes,
      }))
    }
  } catch {
    // supabase not configured locally
  }

  // Active sidebar link
  const activeHref = tag
    ? `/blog?tag=${encodeURIComponent(tag)}`
    : category === 'audits'
      ? '/blog?category=audits'
      : category === 'changelog'
        ? '/blog?category=changelog'
        : '/blog'

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
                {CATEGORIES.map((cat, i) => {
                  const active = cat.href === activeHref
                  const isAuditLink = cat.label === 'Audit Reports'
                  return (
                    <>
                      {isAuditLink && <div key="divider" className="border-t border-white/[0.06] my-3" />}
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
                    </>
                  )
                })}
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

            {isChangelog ? (
              <ChangelogFeed />
            ) : cards.length === 0 ? (
              <div className="text-center py-20 text-[#5A5955]">
                <p className="text-sm">{isAudits ? 'No audit reports published yet.' : 'No posts yet. Check back soon.'}</p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {cards.map(card => (
                  <Link
                    key={card.id}
                    href={card.href}
                    className="group rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-all overflow-hidden flex flex-col"
                  >
                    {/* Cover image */}
                    <div className="relative h-44 w-full overflow-hidden shrink-0">
                      {card.og_image_url ? (
                        <Image
                          src={card.og_image_url}
                          alt={card.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 100vw, 50vw"
                        />
                      ) : (
                        <div className={`h-full w-full bg-gradient-to-br ${
                          isAudits ? TAG_GRADIENTS.audits : tagGradient(card.tags)
                        } opacity-40`} />
                      )}
                    </div>

                    {/* Card body */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {card.badge && (
                          <span className="text-[10px] font-mono text-[#3DDC84] bg-[#3DDC84]/10 px-2 py-0.5 rounded-full">{card.badge}</span>
                        )}
                        {!card.badge && card.tags.length > 0 && (
                          <span className="text-[10px] font-mono text-[#6E56CF]">{card.tags[0]}</span>
                        )}
                      </div>
                      <h2 className="font-medium text-base text-[#F1F0EE] group-hover:text-white transition-colors mb-2 leading-snug">
                        {card.title}
                      </h2>
                      {card.excerpt && (
                        <p className="text-sm text-[#8B8A85] leading-relaxed line-clamp-2 flex-1">{card.excerpt}</p>
                      )}
                      <div className="flex items-center gap-3 mt-3">
                        {card.reading_time_minutes && (
                          <span className="text-[10px] font-mono text-[#5A5955]">{card.reading_time_minutes} min</span>
                        )}
                        {card.published_at && (
                          <span className="text-[10px] text-[#3A3A3A]">
                            {new Date(card.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
