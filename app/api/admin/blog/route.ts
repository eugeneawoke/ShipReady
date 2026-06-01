import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { verifyBearerToken } from '@/lib/server/verify-bearer'

export const runtime = 'nodejs'

function adminAuth(request: NextRequest): boolean {
  return verifyBearerToken(request.headers.get('authorization'), process.env.ADMIN_SECRET)
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// GET /api/admin/blog — list all posts
export async function GET(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, status, published_at, tags, reading_time_minutes, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data })
}

// POST /api/admin/blog — create draft
export async function POST(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { title?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = body.title?.trim() || 'Untitled'
  const supabase = createServiceClient()

  // Generate unique slug
  let slug = slugify(title)
  const { count } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)

  if (count && count > 0) {
    slug = `${slug}-${Date.now()}`
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .insert({ title, slug, status: 'draft' })
    .select('id, slug')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ post: data }, { status: 201 })
}
