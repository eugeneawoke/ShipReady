import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

function adminAuth(req: NextRequest): boolean {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return false
  return req.headers.get('authorization') === `Bearer ${secret}`
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80)
}

export async function GET(req: NextRequest) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('audit_reports')
    .select('id, slug, company_name, company_website, status, published_at, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ audits: data })
}

export async function POST(req: NextRequest) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  let body: { company_name?: string; company_website?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = body.company_name?.trim() || 'New Audit'
  const website = body.company_website?.trim() || ''
  const supabase = createServiceClient()

  let slug = slugify(name)
  const { count } = await supabase.from('audit_reports').select('id', { count: 'exact', head: true }).eq('slug', slug)
  if (count && count > 0) slug = `${slug}-${Date.now()}`

  const { data, error } = await supabase
    .from('audit_reports')
    .insert({ company_name: name, company_website: website, slug, status: 'draft' })
    .select('id, slug').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ audit: data }, { status: 201 })
}
