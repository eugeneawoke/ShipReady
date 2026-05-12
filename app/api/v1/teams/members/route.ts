import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import { validateApiKey, ApiKeyError } from '@/lib/api/api-key-auth'
import { sendTeamInvite } from '@/lib/email/send-team-invite'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
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

  const supabase = createServiceClient()
  const { data: members, error } = await supabase
    .from('team_members')
    .select('id, invited_email, role, invited_at, accepted_at')
    .eq('owner_user_id', apiKeyCtx.userId)
    .order('invited_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }

  type MemberRow = { id: string; invited_email: string; role: string; invited_at: string; accepted_at: string | null }
  return NextResponse.json({
    members: (members as MemberRow[] ?? []).map((m) => ({
      id: m.id,
      invited_email: m.invited_email,
      role: m.role,
      invited_at: m.invited_at,
      accepted_at: m.accepted_at,
      status: m.accepted_at ? 'accepted' : 'pending',
    })),
  })
}

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

  if (apiKeyCtx.plan !== 'agency') {
    return NextResponse.json({ error: 'Team management requires Agency plan' }, { status: 403 })
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const email = body?.email
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 422 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('team_members')
    .select('id')
    .eq('owner_user_id', apiKeyCtx.userId)
    .eq('invited_email', email)
    .is('accepted_at', null)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Invite already pending for this email' }, { status: 409 })
  }

  const { data: ownerData } = await supabase.auth.admin.getUserById(apiKeyCtx.userId)
  const ownerEmail = ownerData.user?.email ?? ''

  const token = randomBytes(32).toString('hex')

  const inviteExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: member, error: insertError } = await supabase
    .from('team_members')
    .insert({
      owner_user_id: apiKeyCtx.userId,
      invited_email: email,
      invite_token: token,
      invite_expires_at: inviteExpiresAt,
    })
    .select('id, invited_email, invited_at')
    .single()

  if (insertError || !member) {
    if (insertError?.message?.includes('team_seat_limit_reached')) {
      return NextResponse.json({ error: 'Team seat limit of 5 reached' }, { status: 422 })
    }
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }

  try {
    await sendTeamInvite({ invitedEmail: email, ownerEmail, inviteToken: token })
  } catch (err) {
    console.warn('[api/v1/teams/members] Failed to send invite email:', err)
  }

  return NextResponse.json(
    { id: member.id, invited_email: member.invited_email, status: 'pending', invited_at: member.invited_at },
    { status: 201 },
  )
}
