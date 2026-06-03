import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { AuditEditor } from './AuditEditor'

export const metadata: Metadata = {
  title: 'Edit Audit Report — Glook Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminAuditEditorPage({ params }: { params: Promise<{ id: string }> }) {
  if (!process.env.ADMIN_SECRET) redirect('/')

  const { id } = await params
  const supabase = createServiceClient()
  const { data: audit, error } = await supabase
    .from('audit_reports').select('*').eq('id', id).single()

  if (error || !audit) notFound()

  // Load linked scan data if scan_id present
  let scanResult = null
  if (audit.scan_id) {
    const { data: scan } = await supabase
      .from('scans').select('result, url, created_at').eq('id', audit.scan_id).single()
    scanResult = scan ?? null
  }

  return (
    <AuditEditor
      audit={audit}
      scanResult={scanResult}
      adminSecret={process.env.ADMIN_SECRET}
    />
  )
}
