import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getUserWithPlan } from '@/lib/auth'
import type { ScanResult } from '@/types/scan'
import { generateReportPdf } from '@/lib/pdf/generate-report-pdf'

export const runtime = 'nodejs'
export const maxDuration = 120

function filenameForDomain(domain: string) {
  return `${domain.replace(/[^a-z0-9.-]+/gi, '-')}-shipready-report.pdf`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getUserWithPlan()
    if (!user || (user.effectivePlan !== 'pro' && user.effectivePlan !== 'agency')) {
      return NextResponse.json({ error: 'Upgrade required' }, { status: 403 })
    }

    const { id } = await params
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('scans')
      .select('id, url, results')
      .eq('id', id)
      .single()

    if (error || !data?.results) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const result = data.results as ScanResult
    let domain = data.url
    try {
      domain = new URL(data.url).hostname
    } catch {
      // use raw url
    }

    const whiteLabel = user.effectivePlan === 'agency' && request.nextUrl.searchParams.get('whiteLabel') === '1'
    const pdf = await generateReportPdf(result, { whiteLabel, domain })

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filenameForDomain(domain)}"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    console.error('[pdf] export failed:', error)
    return NextResponse.json({ error: 'PDF export failed' }, { status: 500 })
  }
}
