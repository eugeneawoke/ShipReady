import { createHash, randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { buildAttributionFromSearchParams, normalizeCampaignCode } from '@/lib/growth/attribution'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'
import { createServiceClient } from '@/lib/supabase'

const ANONYMOUS_COOKIE = 'sr_aid'
const ATTRIBUTION_COOKIE = 'sr_attr'
const ANONYMOUS_MAX_AGE = 60 * 60 * 24 * 180
const ATTRIBUTION_MAX_AGE = 60 * 60 * 24 * 30
const MAX_TEXT_LENGTH = 1024

type AttributionInput = Record<string, unknown>

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

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

function hashIp(ip: string): string {
  const salt = process.env.SCANNER_SECRET || process.env.NEXT_PUBLIC_APP_URL || 'shipready-growth'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
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

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('growth_visits')
    .insert({
      anonymous_id: anonymousId,
      landing_path: landingPath,
      referrer,
      ...attribution,
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
