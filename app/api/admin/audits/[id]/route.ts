import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyBearerToken } from '@/lib/server/verify-bearer'

export const runtime = 'nodejs'

function adminAuth(req: NextRequest): boolean {
  return verifyBearerToken(req.headers.get('authorization'), process.env.ADMIN_SECRET)
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('audit_reports').select('*').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ audit: data })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  let body: Record<string, unknown>
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { id: _id, created_at: _ca, ...patch } = body
  void _id; void _ca
  if (patch.status === 'published' && !patch.published_at) {
    patch.published_at = new Date().toISOString()
  }
  patch.updated_at = new Date().toISOString()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('audit_reports').update(patch).eq('id', id)
    .select('id, slug, status, updated_at').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ audit: data })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase.from('audit_reports').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
