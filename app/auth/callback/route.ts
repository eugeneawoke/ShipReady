import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase'

const ATTRIBUTION_COOKIE = 'sr_attr'
const ATTRIBUTION_FIELDS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'referral_code',
  'promo_code',
] as const

type AttributionField = (typeof ATTRIBUTION_FIELDS)[number]
type AttributionPayload = Partial<Record<AttributionField, string>>

function parseAttributionCookie(value: string | undefined): AttributionPayload {
  if (!value) return {}

  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(value))
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {}

    const attribution: AttributionPayload = {}
    for (const field of ATTRIBUTION_FIELDS) {
      const fieldValue = (parsed as Record<string, unknown>)[field]
      if (typeof fieldValue === 'string') attribution[field] = fieldValue
    }
    return attribution
  } catch {
    return {}
  }
}

async function bindGrowthAttribution(userId: string, attribution: AttributionPayload) {
  if (Object.keys(attribution).length === 0) return

  const supabase = createServiceClient()
  const { data: profile, error: selectError } = await supabase
    .from('profiles')
    .select('first_utm_source, first_utm_medium, first_utm_campaign, first_referral_code, first_promo_code')
    .eq('id', userId)
    .single()

  if (selectError) {
    console.error('[auth/callback] profile attribution read failed:', selectError.message)
    return
  }

  const updates: Record<string, string> = {}
  const mappings = [
    ['utm_source', 'first_utm_source', 'last_utm_source'],
    ['utm_medium', 'first_utm_medium', 'last_utm_medium'],
    ['utm_campaign', 'first_utm_campaign', 'last_utm_campaign'],
    ['referral_code', 'first_referral_code', 'last_referral_code'],
    ['promo_code', 'first_promo_code', 'last_promo_code'],
  ] as const

  for (const [field, firstColumn, lastColumn] of mappings) {
    const value = attribution[field]
    if (!value) continue

    if (!profile?.[firstColumn]) updates[firstColumn] = value
    updates[lastColumn] = value
  }

  if (Object.keys(updates).length === 0) return

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)

  if (updateError) {
    console.error('[auth/callback] profile attribution update failed:', updateError.message)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next') ?? '/'
  // Guard against open redirect: only allow relative paths, block protocol-relative URLs
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        console.error('[auth/callback] getUser failed:', userError.message)
      } else if (user) {
        await bindGrowthAttribution(
          user.id,
          parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value),
        )
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth', request.url))
}
