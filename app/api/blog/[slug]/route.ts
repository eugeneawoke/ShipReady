import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET /api/blog/[slug]
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const isPreview = request.nextUrl.searchParams.get('preview') === 'true'

  const supabase = createServiceClient()
  const query = supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)

  if (!isPreview) {
    query.eq('status', 'published')
  }

  const { data, error } = await query.single()

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ post: data })
}
