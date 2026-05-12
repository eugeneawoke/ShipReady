import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'
import { createClient, createServiceClient, hasSupabaseServiceConfig } from '@/lib/supabase'

const ANONYMOUS_COOKIE = 'sr_aid'
const ANONYMOUS_MAX_AGE = 60 * 60 * 24 * 180
const EVENT_NAMES = new Set([
  'signup_started',
  'scan_started',
  'referral_link_copied',
  'pdf_export_clicked',
  'monitoring_enabled',
])
const MAX_PROPERTIES_BYTES = 4096

type LatestVisit = {
  id: string
  campaign_id: string | null
  referral_code_id: string | null
}

function randomAnonymousId(): string {
  return globalThis.crypto?.randomUUID?.() ?? randomUUID()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function sanitizeProperties(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) return {}

  try {
    const serialized = JSON.stringify(value)
    if (new TextEncoder().encode(serialized).length > MAX_PROPERTIES_BYTES) return {}
    return value
  } catch {
    return {}
  }
}

async function findLatestVisitForAnonymousId(
  supabase: ReturnType<typeof createServiceClient>,
  anonymousId: string | null,
): Promise<LatestVisit | null> {
  if (!anonymousId) return null

  const { data, error } = await supabase
    .from('growth_visits')
    .select('id, campaign_id, referral_code_id')
    .eq('anonymous_id', anonymousId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('[growth/event] visit linkage lookup failed:', error.message)
    return null
  }

  return data as LatestVisit | null
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

  const eventName = typeof body.event_name === 'string' ? body.event_name : null
  if (!eventName || !EVENT_NAMES.has(eventName)) {
    return NextResponse.json({ error: 'Invalid event' }, { status: 400 })
  }

  let userId: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? null
  } catch {
    userId = null
  }

  const existingAnonymousId = request.cookies.get(ANONYMOUS_COOKIE)?.value ?? null
  const shouldCreateAnonymousId = !userId && !existingAnonymousId
  const anonymousId = existingAnonymousId ?? (shouldCreateAnonymousId ? randomAnonymousId() : null)

  if (!hasSupabaseServiceConfig()) {
    const response = NextResponse.json({ ok: true })
    if (shouldCreateAnonymousId && anonymousId) {
      response.cookies.set(ANONYMOUS_COOKIE, anonymousId, {
        maxAge: ANONYMOUS_MAX_AGE,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        httpOnly: true,
      })
    }
    return response
  }

  const supabase = createServiceClient()
  const latestVisit = await findLatestVisitForAnonymousId(supabase, anonymousId)
  const { error } = await supabase
    .from('growth_events')
    .insert({
      user_id: userId,
      anonymous_id: anonymousId,
      visit_id: latestVisit?.id ?? null,
      campaign_id: latestVisit?.campaign_id ?? null,
      referral_code_id: latestVisit?.referral_code_id ?? null,
      event_name: eventName,
      event_properties: sanitizeProperties(body.properties),
    })

  if (error) {
    console.error('[growth/event] insert failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const response = NextResponse.json({ ok: true })

  if (shouldCreateAnonymousId && anonymousId) {
    response.cookies.set(ANONYMOUS_COOKIE, anonymousId, {
      maxAge: ANONYMOUS_MAX_AGE,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      httpOnly: true,
    })
  }

  return response
}
