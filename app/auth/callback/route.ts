import { NextRequest, NextResponse } from 'next/server'
import { parseAttributionCookie, type AttributionPayload } from '@/lib/growth/attribution'
import { createClient, createServiceClient } from '@/lib/supabase'

const ATTRIBUTION_COOKIE = 'sr_attr'

async function bindGrowthAttribution(userId: string, attribution: AttributionPayload | null) {
  if (!attribution) return
  if (Object.keys(attribution).length === 0) return

  const supabase = createServiceClient()
  const lastUpdates: Record<string, string> = {}
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

    const { error: firstUpdateError } = await supabase
      .from('profiles')
      .update({ [firstColumn]: value })
      .eq('id', userId)
      .is(firstColumn, null)

    if (firstUpdateError) {
      console.error(`[auth/callback] ${firstColumn} attribution update failed:`, firstUpdateError.message)
    }

    lastUpdates[lastColumn] = value
  }

  if (Object.keys(lastUpdates).length === 0) return

  const { error: updateError } = await supabase
    .from('profiles')
    .update(lastUpdates)
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
