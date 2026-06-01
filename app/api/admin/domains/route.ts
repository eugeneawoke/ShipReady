import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import type { ScanResult } from '@/types/scan'
import { verifyBearerToken } from '@/lib/server/verify-bearer'

export const runtime = 'nodejs'

function adminAuth(request: NextRequest): boolean {
  return verifyBearerToken(request.headers.get('authorization'), process.env.ADMIN_SECRET)
}

function computeAiReadinessScore(results: ScanResult): number {
  const aiScore = results.ai_visibility?.score ?? 0
  const platforms = results.aiPlatformReadiness
  if (!platforms) return aiScore
  const passing = Object.values(platforms).filter(v => v.status === 'pass').length
  const total = Object.values(platforms).length
  const platformBonus = total > 0 ? (passing / total) * 20 : 0
  return Math.min(100, aiScore * 0.8 + platformBonus)
}

function domainToSlug(domain: string): string {
  return domain
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
}

// POST /api/admin/domains — publish or update a domain page
export async function POST(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { scanId?: string; domain?: string; title?: string; description?: string; category?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.scanId) {
    return NextResponse.json({ error: 'scanId required' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: scan, error: scanErr } = await supabase
    .from('scans')
    .select('id, url, results')
    .eq('id', body.scanId)
    .single()

  if (scanErr || !scan) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  const results = scan.results as ScanResult
  const domain = body.domain ?? scan.url
  const slug = domainToSlug(domain)
  const aiScore = computeAiReadinessScore(results)

  const payload = {
    domain,
    slug,
    title: body.title ?? `${domain} — Site Audit Report`,
    description: body.description ?? `Full website audit for ${domain}: SEO, security, performance, and AI visibility scores.`,
    latest_scan_id: scan.id,
    ai_readiness_score: aiScore,
    category: body.category ?? null,
    is_published: true,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('published_domains')
    .upsert(payload, { onConflict: 'slug' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug: data.slug, url: `/site/${data.slug}` }, { status: 201 })
}

// DELETE /api/admin/domains — unpublish by slug
export async function DELETE(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug query param required' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('published_domains')
    .update({ is_published: false, updated_at: new Date().toISOString() })
    .eq('slug', slug)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
