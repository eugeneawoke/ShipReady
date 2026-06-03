import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase'
import { AdminAuditActions } from './AdminAuditActions'

export const metadata: Metadata = {
  title: 'Audit Reports Admin — Glook',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

type AuditRow = {
  id: string
  slug: string
  company_name: string
  company_website: string
  status: string
  published_at: string | null
  created_at: string
}

export default async function AdminAuditsPage() {
  if (!process.env.ADMIN_SECRET) redirect('/')

  const supabase = createServiceClient()
  const { data: audits } = await supabase
    .from('audit_reports')
    .select('id, slug, company_name, company_website, status, published_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#0E0E0F] text-[#F1F0EE] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-[10px] font-mono text-[#6E56CF] uppercase tracking-widest mb-1">Admin</p>
            <h1 className="text-2xl font-semibold">Audit Reports</h1>
          </div>
          <AdminAuditActions adminSecret={process.env.ADMIN_SECRET ?? ''} />
        </div>

        {!audits || audits.length === 0 ? (
          <div className="text-center py-20 text-[#5A5955]">
            <p className="text-sm">No audit reports yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.06] overflow-hidden">
            <div className="grid grid-cols-[1fr_160px_100px_120px_64px] bg-[#161618] border-b border-white/[0.08] px-5 py-3 text-[10px] font-mono text-[#5A5955] uppercase tracking-widest">
              <span>Company</span>
              <span>Website</span>
              <span>Status</span>
              <span>Published</span>
              <span></span>
            </div>
            {(audits as AuditRow[]).map((audit, i) => (
              <div
                key={audit.id}
                className={`grid grid-cols-[1fr_160px_100px_120px_64px] px-5 py-3 items-center border-b border-white/[0.04] ${
                  i % 2 === 0 ? 'bg-[#0E0E0F]' : 'bg-[#111113]'
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-[#F1F0EE] truncate">{audit.company_name}</p>
                  <p className="text-[10px] text-[#3A3A3A] font-mono">/audits/{audit.slug}</p>
                </div>
                <span className="text-xs text-[#8B8A85] truncate">{audit.company_website}</span>
                <span className={`text-[10px] font-mono uppercase ${
                  audit.status === 'published' ? 'text-[#3DDC84]' : 'text-[#F5C518]'
                }`}>{audit.status}</span>
                <span className="text-xs text-[#5A5955]">
                  {audit.published_at
                    ? new Date(audit.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
                    : '—'}
                </span>
                <Link
                  href={`/admin/audits/${audit.id}`}
                  className="text-[10px] font-mono text-[#6E56CF] hover:text-[#a78bfa] transition-colors uppercase"
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
