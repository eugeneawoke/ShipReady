import { NextRequest, NextResponse } from 'next/server'
import { requireSameOriginJsonRequest } from '@/lib/server/request-guards'
import { createClient, createServiceClient } from '@/lib/supabase'

const ANONYMOUS_COOKIE = 'sr_aid'
const EVENT_NAMES = new Set([
  'signup_started',
  'scan_started',
  'referral_link_copied',
  'pdf_export_clicked',
  'monitoring_enabled',
])
const MAX_PROPERTIES_BYTES = 4096

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

  const anonymousId = request.cookies.get(ANONYMOUS_COOKIE)?.value ?? null
  const supabase = createServiceClient()
  const { error } = await supabase
    .from('growth_events')
    .insert({
      user_id: userId,
      anonymous_id: anonymousId,
      event_name: eventName,
      event_properties: sanitizeProperties(body.properties),
    })

  if (error) {
    console.error('[growth/event] insert failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
