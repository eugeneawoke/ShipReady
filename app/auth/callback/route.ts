import { NextRequest, NextResponse } from 'next/server'
import { parseAttributionCookie, sanitizeAttributionObject } from '@/lib/growth/attribution'
import { bindGrowthAttributionForUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase'

const ANONYMOUS_COOKIE = 'sr_aid'
const ATTRIBUTION_COOKIE = 'sr_attr'

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
        const cookieAttribution = parseAttributionCookie(request.cookies.get(ATTRIBUTION_COOKIE)?.value)
        const metadataAttribution = sanitizeAttributionObject(user.user_metadata?.growth_attribution)
        await bindGrowthAttributionForUser(user.id, {
          anonymousId: request.cookies.get(ANONYMOUS_COOKIE)?.value,
          fallbackAttribution: cookieAttribution ?? metadataAttribution,
        })
      }
      return NextResponse.redirect(new URL(next, request.url))
    }
    console.error('[auth/callback] exchangeCodeForSession failed:', error.message)
  }

  return NextResponse.redirect(new URL('/auth/login?error=auth', request.url))
}
