import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'

export const runtime = 'nodejs'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  let apiKeyCtx
  try {
    apiKeyCtx = await validateApiKey(request.headers.get('authorization'))
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  if (apiKeyCtx.plan !== 'agency') {
    return NextResponse.json({ error: 'Team management requires Agency plan' }, { status: 403 })
  }

  const { memberId } = await params

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('owner_user_id', apiKeyCtx.userId)
    .select('id')

  if (error) {
    return NextResponse.json({ error: 'Failed to remove team member' }, { status: 500 })
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
  }

  return new NextResponse(null, { status: 204 })
}
