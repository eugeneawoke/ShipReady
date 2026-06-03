import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { generateHTML } from '@tiptap/html'
import StarterKit from '@tiptap/starter-kit'
import ExtLink from '@tiptap/extension-link'
import ExtImage from '@tiptap/extension-image'
import ExtHighlight from '@tiptap/extension-highlight'
import ExtTypography from '@tiptap/extension-typography'
import { createServiceClient } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'
import type { JSONContent } from '@tiptap/react'

export const revalidate = 3600

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://shipready.app').replace(/\/$/, '')

type BlogPost = {
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
  status: string
  published_at: string | null
}

async function getPost(slug: string, preview: boolean): Promise<BlogPost | null> {
  try {
    const supabase = createServiceClient()
    const query = supabase.from('blog_posts').select('*').eq('slug', slug)
    if (!preview) query.eq('status', 'published')
    const { data } = await query.single()
    return data ?? null
  } catch {
    return null
  }
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { preview } = await searchParams
  const post = await getPost(slug, preview === 'true')
  if (!post) return {}

  const title = post.meta_title || post.title
  const description = post.meta_description || post.excerpt || undefined

  return {
    title: `${title} — Glook Blog`,
    description,
    openGraph: post.og_image_url ? {
      images: [{ url: post.og_image_url }],
    } : undefined,
    alternates: { canonical: `${BASE}/blog/${slug}` },
  }
}

const TIPTAP_EXTENSIONS = [StarterKit, ExtLink, ExtImage, ExtHighlight, ExtTypography]

export default async function BlogArticlePage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const tnav = await getTranslations('Landing.nav')

  const post = await getPost(slug, preview === 'true')
  if (!post) notFound()

  const html = post.content_json ? generateHTML(post.content_json, TIPTAP_EXTENSIONS) : ''

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.og_image_url ?? undefined,
    datePublished: post.published_at ?? undefined,
    author: { '@type': 'Organization', name: 'Glook', url: BASE },
    publisher: { '@type': 'Organization', name: 'Glook', url: BASE },
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* Article JSON-LD — static controlled data, not user input */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <SiteHeader
        sticky
        mobileNavItems={[
          { label: tnav('pricing'), href: '/pricing' },
          { label: tnav('roadmap'), href: '/roadmap' },
        ]}
      />

      <main className="max-w-2xl mx-auto px-6 py-16">
        {preview === 'true' && (
          <div className="mb-6 px-4 py-2 rounded-lg bg-[#F5C518]/10 border border-[#F5C518]/20 text-[#F5C518] text-xs font-mono">
            PREVIEW MODE — draft content
          </div>
        )}

        <div className="mb-4">
          <Link href="/blog" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">← Blog</Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {(post.tags ?? []).map(t => (
            <span key={t} className="text-[10px] font-mono text-[#6E56CF]">{t}</span>
          ))}
          {post.reading_time_minutes && (
            <span className="text-[10px] font-mono text-[#5A5955]">{post.reading_time_minutes} min read</span>
          )}
          {post.published_at && (
            <span className="text-[10px] text-[#3A3A3A]">
              {new Date(post.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>

        <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-[#8B8A85] text-base leading-relaxed mb-8 border-l-2 border-[#6E56CF]/40 pl-4">
            {post.excerpt}
          </p>
        )}

        {/* Tiptap HTML rendered from admin editor — admin-only content, not user-submitted */}
        <article
          className="prose prose-invert prose-sm max-w-none"
          style={{ color: '#C9C8C3', lineHeight: '1.75' }}
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* CTA */}
        <div className="mt-14 p-6 rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 text-center">
          <p className="text-sm font-medium text-[#F1F0EE] mb-1">Audit your own site</p>
          <p className="text-[#8B8A85] text-sm mb-4">Free scan — no signup required for the first scan.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium"
          >
            Try Glook free →
          </Link>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
