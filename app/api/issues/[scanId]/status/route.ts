import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export const runtime = 'nodejs'

type IssueStatus = 'open' | 'fixed' | 'ignored'
const VALID_STATUSES = new Set<string>(['open', 'fixed', 'ignored'])

// GET /api/issues/[scanId]/status — fetch all statuses for this scan (for the current user)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_issue_status')
    .select('issue_id, status')
    .eq('user_id', user.id)
    .eq('scan_id', scanId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const statuses: Record<string, IssueStatus> = {}
  for (const row of data ?? []) {
    statuses[row.issue_id] = row.status as IssueStatus
  }

  return NextResponse.json({ statuses })
}

// PATCH /api/issues/[scanId]/status — upsert one issue status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  const { scanId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { issueId?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.issueId || typeof body.issueId !== 'string') {
    return NextResponse.json({ error: 'issueId required' }, { status: 422 })
  }
  if (!body.status || !VALID_STATUSES.has(body.status)) {
    return NextResponse.json({ error: 'status must be open, fixed, or ignored' }, { status: 422 })
  }

  const { error } = await supabase
    .from('user_issue_status')
    .upsert(
      {
        user_id: user.id,
        scan_id: scanId,
        issue_id: body.issueId,
        status: body.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,scan_id,issue_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
