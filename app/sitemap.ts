import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase'
import { competitorSlugs } from '@/lib/vs/competitors'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, '')
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date('2026-05-26'), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/seo`, lastModified: new Date('2026-05-26'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/security`, lastModified: new Date('2026-05-26'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/ai-visibility`, lastModified: new Date('2026-05-26'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/ai-readiness-report`, lastModified: new Date('2026-05-26'), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date('2026-05-26'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/roadmap`, lastModified: new Date('2026-05-26'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date('2026-05-11'), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terms`, lastModified: new Date('2026-05-11'), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const checkSlugs = [
    'performance', 'seo', 'security', 'mobile', 'ai-visibility',
    'accessibility', 'lcp', 'csp-headers', 'llms-txt', 'structured-data',
  ]
  const checkRoutes: MetadataRoute.Sitemap = checkSlugs.map(slug => ({
    url: `${base}/check/${slug}`,
    lastModified: new Date('2026-05-26'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Blog pages
  let blogRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/blog`, lastModified: new Date('2026-05-29'), changeFrequency: 'weekly', priority: 0.7 },
  ]
  try {
    const supabaseBlog = createServiceClient()
    const { data: posts } = await supabaseBlog
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
    blogRoutes = [
      ...blogRoutes,
      ...(posts ?? []).map(p => ({
        url: `${base}/blog/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    // skip if supabase not configured
  }

  // Competitor comparison pages
  const vsRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/vs`, lastModified: new Date('2026-05-29'), changeFrequency: 'monthly', priority: 0.7 },
    ...competitorSlugs.map(slug => ({
      url: `${base}/vs/${slug}`,
      lastModified: new Date('2026-05-29'),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]

  // Published domain pages
  let domainRoutes: MetadataRoute.Sitemap = []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('published_domains')
      .select('slug, updated_at')
      .eq('is_published', true)
    domainRoutes = (data ?? []).map(row => ({
      url: `${base}/site/${row.slug}`,
      lastModified: new Date(row.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.75,
    }))
  } catch {
    // supabase not configured locally — skip
  }

  // Audit report pages
  let auditRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/audits`, lastModified: new Date('2026-05-29'), changeFrequency: 'weekly', priority: 0.7 },
  ]
  try {
    const supabaseAudits = createServiceClient()
    const { data: audits } = await supabaseAudits
      .from('audit_reports')
      .select('slug, updated_at')
      .eq('status', 'published')
    auditRoutes = [
      ...auditRoutes,
      ...(audits ?? []).map(a => ({
        url: `${base}/audits/${a.slug}`,
        lastModified: new Date(a.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.75,
      })),
    ]
  } catch {
    // skip if supabase not configured
  }

  return [...staticRoutes, ...checkRoutes, ...vsRoutes, ...blogRoutes, ...auditRoutes, ...domainRoutes]
}
