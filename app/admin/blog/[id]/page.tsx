import type { Metadata } from 'next'
import { redirect, notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase'
import { BlogEditor } from './BlogEditor'

export const metadata: Metadata = {
  title: 'Edit Post — ShipReady Admin',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function AdminBlogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  if (!process.env.ADMIN_SECRET) {
    redirect('/')
  }

  const { id } = await params
  const supabase = createServiceClient()
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !post) notFound()

  return (
    <BlogEditor
      post={post}
      adminSecret={process.env.ADMIN_SECRET}
    />
  )
}
