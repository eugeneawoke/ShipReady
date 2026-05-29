import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createServiceClient } from '@/lib/supabase'
import { SiteHeader } from '@/components/SiteHeader'
import { CinematicFooter } from '@/components/ui/motion-footer'
import { MobileDockSpacer } from '@/components/navigation/MobileDockSpacer'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Site Audit Reports — ShipReady',
  description: 'In-depth editorial audits of well-known websites. See real scores, top issues, and expert analysis from ShipReady.',
}

type AuditRow = {
  id: string
  slug: string
  company_name: string
  company_website: string
  editorial_summary: string | null
  og_image_url: string | null
  published_at: string
}

export default async function AuditsPage() {
  const tnav = await getTranslations('Landing.nav')

  let audits: AuditRow[] = []
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('audit_reports')
      .select('id, slug, company_name, company_website, editorial_summary, og_image_url, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
    audits = data ?? []
  } catch {
    // skip if supabase not configured
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
        <p className="text-[11px] text-[#6E56CF] uppercase tracking-[0.15em] mb-3 font-mono">Audit Reports</p>
        <h1 className="text-[28px] sm:text-[36px] font-medium tracking-tight mb-3">
          Real site audits, published
        </h1>
        <p className="text-[#8B8A85] text-sm leading-relaxed max-w-lg mb-10">
          In-depth technical audits of well-known websites — with real scan data, verified findings, and editorial analysis.
        </p>

        {audits.length === 0 ? (
          <div className="text-center py-20 text-[#5A5955]">
            <p className="text-sm">First audit reports coming soon.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {audits.map(audit => (
              <Link
                key={audit.id}
                href={`/audits/${audit.slug}`}
                className="group block p-6 rounded-2xl bg-[#161618] border border-white/[0.06] hover:border-[#6E56CF]/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h2 className="font-medium text-base group-hover:text-white transition-colors">
                    {audit.company_name}
                  </h2>
                  <span className="text-[10px] font-mono text-[#5A5955] shrink-0">
                    {new Date(audit.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#6E56CF] mb-2">{audit.company_website}</p>
                {audit.editorial_summary && (
                  <p className="text-sm text-[#8B8A85] leading-relaxed line-clamp-2">{audit.editorial_summary}</p>
                )}
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
