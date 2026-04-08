import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('scans')
    .select('id, url, status, results, user_id')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  return NextResponse.json({
    id: data.id,
    url: data.url,
    status: data.status,
    results: data.results,
  })
}
