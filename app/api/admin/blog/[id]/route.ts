import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyBearerToken } from '@/lib/server/verify-bearer'

export const runtime = 'nodejs'

function adminAuth(request: NextRequest): boolean {
  return verifyBearerToken(request.headers.get('authorization'), process.env.ADMIN_SECRET)
}

// GET /api/admin/blog/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ post: data })
}

// PATCH /api/admin/blog/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Disallow updating id/created_at
  const { id: _id, created_at: _ca, ...patch } = body as Record<string, unknown>
  void _id; void _ca

  // Auto-set published_at when publishing
  if (patch.status === 'published' && !patch.published_at) {
    patch.published_at = new Date().toISOString()
  }

  patch.updated_at = new Date().toISOString()

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .update(patch)
    .eq('id', id)
    .select('id, slug, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data })
}

// DELETE /api/admin/blog/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
