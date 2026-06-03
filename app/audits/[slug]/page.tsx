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
import { ScoreGrid } from '@/components/report/ScoreGrid'
import type { JSONContent } from '@tiptap/react'
import type { ScanResult, Issue } from '@/types/scan'

export const revalidate = 3600

const BASE = (process.env.NEXT_PUBLIC_APP_URL || 'https://glook.dev').replace(/\/$/, '')
const TIPTAP_EXTENSIONS = [StarterKit, ExtLink, ExtImage, ExtHighlight, ExtTypography]

type AuditReport = {
  id: string
  slug: string
  company_name: string
  company_website: string
  scan_id: string | null
  editorial_json: JSONContent | null
  editorial_summary: string | null
  og_image_url: string | null
  status: string
  published_at: string | null
}

async function getAudit(slug: string, preview: boolean): Promise<AuditReport | null> {
  try {
    const supabase = createServiceClient()
    const q = supabase.from('audit_reports').select('*').eq('slug', slug)
    if (!preview) q.eq('status', 'published')
    const { data } = await q.single()
    return data ?? null
  } catch { return null }
}

export async function generateMetadata({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const { preview } = await searchParams
  const audit = await getAudit(slug, preview === 'true')
  if (!audit) return {}
  return {
    title: `${audit.company_name} Site Audit — Glook`,
    description: audit.editorial_summary ?? `An independent site audit of ${audit.company_website} covering SEO, AI visibility, security, and performance.`,
    openGraph: audit.og_image_url ? { images: [{ url: audit.og_image_url }] } : undefined,
    alternates: { canonical: `${BASE}/audits/${slug}` },
  }
}

export default async function AuditReportPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ preview?: string }>
}) {
  const { slug } = await params
  const { preview } = await searchParams
  const tnav = await getTranslations('Landing.nav')

  const audit = await getAudit(slug, preview === 'true')
  if (!audit) notFound()

  let scanResult: ScanResult | null = null
  let scanUrl: string | null = null
  let scanDate: string | null = null
  if (audit.scan_id) {
    try {
      const supabase = createServiceClient()
      const { data } = await supabase
        .from('scans').select('result, url, created_at').eq('id', audit.scan_id).single()
      if (data) {
        scanResult = data.result as ScanResult | null
        scanUrl = data.url
        scanDate = data.created_at
      }
    } catch { /* skip */ }
  }

  const html = audit.editorial_json ? generateHTML(audit.editorial_json, TIPTAP_EXTENSIONS) : ''

  const topIssues: Issue[] = []
  if (scanResult) {
    const categories = ['performance', 'seo', 'security', 'mobile', 'ai_visibility', 'accessibility'] as const
    for (const cat of categories) {
      const catData = scanResult[cat]
      if (catData?.issues) {
        for (const issue of catData.issues) {
          if (issue.confidence === 'verified' && issue.scoreEligible !== false) {
            topIssues.push(issue)
          }
        }
      }
    }
    topIssues.sort((a, b) => {
      const w = { critical: 4, high: 3, medium: 2, low: 1 }
      return (w[b.severity as keyof typeof w] ?? 0) - (w[a.severity as keyof typeof w] ?? 0)
    })
    topIssues.splice(5)
  }

  const scores = scanResult ? {
    performance: scanResult.performance?.score ?? null,
    seo: scanResult.seo?.score ?? null,
    security: scanResult.security?.score ?? null,
    mobile: scanResult.mobile?.score ?? null,
    ai_visibility: scanResult.ai_visibility?.score ?? null,
    accessibility: scanResult.accessibility?.score ?? null,
  } : null

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${audit.company_name} Site Audit`,
    description: audit.editorial_summary ?? undefined,
    datePublished: audit.published_at ?? undefined,
    author: { '@type': 'Organization', name: 'Glook', url: BASE },
    about: { '@type': 'WebSite', url: audit.company_website },
  }

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE]">
      {/* JSON-LD structured data — static controlled data, not user input */}
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
          <Link href="/audits" className="text-sm text-[#8B8A85] hover:text-[#F1F0EE] transition-colors">← Audit Reports</Link>
        </div>

        <div className="mb-8">
          <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-2 font-mono">Site Audit</p>
          <h1 className="text-[28px] sm:text-[36px] font-semibold tracking-tight mb-2">{audit.company_name}</h1>
          <p className="text-[11px] font-mono text-[#5A5955]">
            <a href={scanUrl ?? audit.company_website} target="_blank" rel="noopener noreferrer"
              className="hover:text-[#6E56CF] transition-colors">
              {scanUrl ?? audit.company_website}
            </a>
            {scanDate && (
              <span className="ml-3">
                Audited {new Date(scanDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>

        {scores && (
          <div className="mb-10 p-6 rounded-2xl bg-[#161618] border border-white/[0.06]">
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-5">Category scores</p>
            <ScoreGrid scores={scores} />
          </div>
        )}

        {audit.editorial_summary && (
          <div className="mb-8 p-5 rounded-xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/20">
            <p className="text-sm text-[#C9C8C3] leading-relaxed italic">&ldquo;{audit.editorial_summary}&rdquo;</p>
          </div>
        )}

        {topIssues.length > 0 && (
          <div className="mb-10">
            <p className="text-[10px] font-mono text-[#5A5955] uppercase tracking-widest mb-4">Top verified issues</p>
            <div className="space-y-2">
              {topIssues.map(issue => (
                <div key={issue.id} className="flex items-start gap-3 p-4 rounded-xl bg-[#161618] border border-white/[0.06]">
                  <span className={`text-[10px] font-mono uppercase mt-0.5 shrink-0 ${
                    issue.severity === 'critical' ? 'text-[#FF4444]'
                    : issue.severity === 'high' ? 'text-[#F5C518]'
                    : 'text-[#8B8A85]'
                  }`}>{issue.severity}</span>
                  <div>
                    <p className="text-sm text-[#F1F0EE] font-medium">{issue.title}</p>
                    {issue.description && (
                      <p className="text-xs text-[#8B8A85] mt-0.5 leading-relaxed">{issue.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tiptap HTML from admin editor — not user-submitted content */}
        {html && (
          <article
            className="prose prose-invert prose-sm max-w-none mb-10"
            style={{ color: '#C9C8C3', lineHeight: '1.75' }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        <div className="mt-10 p-6 rounded-2xl bg-[#6E56CF]/[0.06] border border-[#6E56CF]/25 text-center">
          <p className="text-sm font-medium text-[#F1F0EE] mb-1">Audit your own site →</p>
          <p className="text-[#8B8A85] text-sm mb-4">Free scan — no signup required for the first scan.</p>
          <Link href="/"
            className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-xl bg-[#6E56CF] text-white hover:bg-[#7C68D4] transition-colors font-medium">
            Try Glook free
          </Link>
        </div>
      </main>

      <MobileDockSpacer />
      <CinematicFooter scanHref="/" pricingHref="/pricing" />
    </div>
  )
}
