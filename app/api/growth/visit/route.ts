import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { ipAddress } from '@vercel/functions'
import {
  buildAttributionFromSearchParams,
  normalizeCampaignCode,
  type AttributionPayload,
} from '@/lib/growth/attribution'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'
import { createClient, createServiceClient, hasSupabaseServiceConfig } from '@/lib/supabase'

const ANONYMOUS_COOKIE = 'sr_aid'
const ATTRIBUTION_COOKIE = 'sr_attr'
const ANONYMOUS_MAX_AGE = 60 * 60 * 24 * 180
const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30
const MAX_TEXT_LENGTH = 1024

type AttributionInput = Record<string, unknown>
type ServiceClient = ReturnType<typeof createServiceClient>

type GrowthReferenceIds = {
  campaignId: string | null
  referralCodeId: string | null
}

function randomAnonymousId(): string {
  return globalThis.crypto?.randomUUID?.() ?? randomUUID()
}

function safeString(value: unknown, maxLength = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function sanitizeAttribution(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const input = value as AttributionInput
  const params = new URLSearchParams()
  const utmFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const

  for (const field of utmFields) {
    const normalized = normalizeCampaignCode(safeString(input[field], 128))
    if (normalized) params.set(field, normalized)
  }

  const referralCode = normalizeCampaignCode(
    safeString(input.ref, 128) ?? safeString(input.referral_code, 128),
  )
  if (referralCode) params.set('ref', referralCode)

  const promoCode = normalizeCampaignCode(
    safeString(input.promo, 128) ?? safeString(input.promo_code, 128),
  )
  if (promoCode) params.set('promo', promoCode)

  return buildAttributionFromSearchParams(params)
}

function getClientIp(request: NextRequest): string | null {
  return ipAddress(request) ?? null
}

function hashIp(ip: string | null): string | null {
  const salt = process.env.IP_HASH_SALT ?? ''
  if (!ip) return null
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}

async function findActiveCampaignByCode(supabase: ServiceClient, code: string | null) {
  if (!code) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('id')
    .eq('code', code)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle()

  if (error) {
    console.error('[growth/visit] campaign resolution failed:', error.message)
    return null
  }

  return data?.id ?? null
}

async function findActiveCampaignById(supabase: ServiceClient, id: string | null) {
  if (!id) return null

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('growth_campaigns')
    .select('id')
    .eq('id', id)
    .eq('is_active', true)
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`expires_at.is.null,expires_at.gt.${now}`)
    .maybeSingle()

  if (error) {
    console.error('[growth/visit] campaign resolution failed:', error.message)
    return null
  }

  return data?.id ?? null
}

async function resolveGrowthReferenceIds(
  supabase: ServiceClient,
  attribution: AttributionPayload,
): Promise<GrowthReferenceIds> {
  const now = new Date().toISOString()
  let campaignId: string | null = null
  let referralCodeId: string | null = null
  const referralCode = normalizeCampaignCode(attribution.referral_code)

  if (referralCode) {
    const { data, error } = await supabase
      .from('referral_codes')
      .select('id, campaign_id, max_uses, uses_count')
      .eq('code', referralCode)
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .maybeSingle()

    if (error) {
      console.error('[growth/visit] referral resolution failed:', error.message)
    } else if (data && (!data.max_uses || data.uses_count < data.max_uses)) {
      referralCodeId = data.id
      campaignId = await findActiveCampaignById(supabase, data.campaign_id)
    }
  }

  if (!campaignId) {
    campaignId = await findActiveCampaignByCode(supabase, normalizeCampaignCode(attribution.promo_code))
  }

  if (!campaignId) {
    campaignId = await findActiveCampaignByCode(supabase, normalizeCampaignCode(attribution.utm_campaign))
  }

  return { campaignId, referralCodeId }
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[growth/visit] auth user lookup failed:', error.message)
      return null
    }

    return user?.id ?? null
  } catch (error) {
    console.error('[growth/visit] auth user lookup failed:', error)
    return null
  }
}

async function bindRecentAnonymousGrowthRowsToUser(
  supabase: ServiceClient,
  userId: string,
  anonymousId: string,
) {
  const [{ error: visitsError }, { error: eventsError }] = await Promise.all([
    supabase
      .from('growth_visits')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null),
    supabase
      .from('growth_events')
      .update({ user_id: userId })
      .eq('anonymous_id', anonymousId)
      .is('user_id', null),
  ])

  if (visitsError) console.error('[growth/visit] anonymous visit binding failed:', visitsError.message)
  if (eventsError) console.error('[growth/visit] anonymous event binding failed:', eventsError.message)
}

export async function POST(request: NextRequest) {
  const guardResponse = requireSameOriginJsonRequest(request)
  if (guardResponse) return guardResponse

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const attribution = sanitizeAttribution(body.attribution)
  const anonymousId = request.cookies.get(ANONYMOUS_COOKIE)?.value || randomAnonymousId()
  const landingPath = safeString(body.landingPath)
  const referrer = safeString(body.referrer, 2048)
  const userAgent = safeString(request.headers.get('user-agent'), 1024)

  if (!hasSupabaseServiceConfig()) {
    const response = NextResponse.json({ ok: true })
    const secure = process.env.NODE_ENV === 'production'

    response.cookies.set(ANONYMOUS_COOKIE, anonymousId, {
      maxAge: ANONYMOUS_MAX_AGE,
      sameSite: 'lax',
      secure,
      path: '/',
      httpOnly: true,
    })

    response.cookies.set(ATTRIBUTION_COOKIE, encodeURIComponent(JSON.stringify(attribution)), {
      maxAge: ATTRIBUTION_MAX_AGE,
      sameSite: 'lax',
      secure,
      path: '/',
      httpOnly: false,
    })

    return response
  }

  const supabase = createServiceClient()
  const userId = await getCurrentUserId()
  if (userId) {
    await bindRecentAnonymousGrowthRowsToUser(supabase, userId, anonymousId)
  }

  const references = await resolveGrowthReferenceIds(supabase, attribution)
  const { error } = await supabase
    .from('growth_visits')
    .insert({
      anonymous_id: anonymousId,
      user_id: userId,
      campaign_id: references.campaignId,
      referral_code_id: references.referralCodeId,
      landing_path: landingPath,
      referrer,
      utm_source: attribution.utm_source ?? null,
      utm_medium: attribution.utm_medium ?? null,
      utm_campaign: attribution.utm_campaign ?? null,
      utm_content: attribution.utm_content ?? null,
      utm_term: attribution.utm_term ?? null,
      referral_code: attribution.referral_code ?? null,
      promo_code: attribution.promo_code ?? null,
      attribution,
      user_agent: userAgent,
      ip_hash: hashIp(getClientIp(request)),
    })

  if (error) {
    console.error('[growth/visit] insert failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })
  const secure = process.env.NODE_ENV === 'production'

  response.cookies.set(ANONYMOUS_COOKIE, anonymousId, {
    maxAge: ANONYMOUS_MAX_AGE,
    sameSite: 'lax',
    secure,
    path: '/',
    httpOnly: true,
  })

  response.cookies.set(ATTRIBUTION_COOKIE, encodeURIComponent(JSON.stringify(attribution)), {
    maxAge: ATTRIBUTION_MAX_AGE,
    sameSite: 'lax',
    secure,
    path: '/',
    httpOnly: false,
  })

  return response
}
