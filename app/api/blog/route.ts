import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/blog — published posts list
export async function GET() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ posts: [] })
  }
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, tags, reading_time_minutes, og_image_url, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ posts: data ?? [] })
}
