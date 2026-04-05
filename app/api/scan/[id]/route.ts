import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('scans')
    .select('id, url, status, results, created_at, updated_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}
