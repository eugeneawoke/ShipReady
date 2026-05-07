import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  let apiKeyCtx
  try {
    apiKeyCtx = await validateApiKey(request.headers.get('authorization'))
  } catch (err) {
    if (err instanceof ApiKeyError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const token = body?.token
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'token is required' }, { status: 422 })
  }

  const supabase = createServiceClient()
  const { data: member, error } = await supabase
    .from('team_members')
    .select('id, owner_user_id')
    .eq('invite_token', token)
    .is('accepted_at', null)
    .maybeSingle()

  if (error || !member) {
    return NextResponse.json({ error: 'Invite not found or already accepted' }, { status: 404 })
  }

  if (apiKeyCtx.userId === member.owner_user_id) {
    return NextResponse.json({ error: 'You cannot accept your own invite' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('team_members')
    .update({
      member_user_id: apiKeyCtx.userId,
      accepted_at: new Date().toISOString(),
      invite_token: null,
    })
    .eq('id', member.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to accept invite' }, { status: 500 })
  }

  return NextResponse.json({ message: 'Invite accepted' })
}
