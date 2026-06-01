export const runtime = 'nodejs'

import { verifyIpnRequest } from '@/lib/payments/paypro/signature'
import { parseIpnPayload } from '@/lib/payments/paypro/mapper'
import { handlePayProEvent } from '@/lib/payments/paypro/handler'
import { createServiceClient } from '@/lib/supabase'
import { isSandboxMode } from '@/lib/payments/paypro/config'

export async function POST(request: Request): Promise<Response> {
  // Step 1: Parse body as application/x-www-form-urlencoded
  const text = await request.text()
  const body = Object.fromEntries(new URLSearchParams(text))

  // Step 2: Verify signature
  const validationKey = process.env.PAYPRO_VALIDATION_KEY
  if (!validationKey) {
    return new Response('Webhook not configured', { status: 500 })
  }

  const isValid = verifyIpnRequest(body, validationKey)
  if (!isValid) {
    return new Response('Invalid signature', { status: 401 })
  }

  // Step 2b: Reject test-mode IPNs in production (and vice versa)
  const ipnTestMode = body['TEST_MODE'] === 'true' || body['TEST_MODE'] === '1'
  const orderId = body['ORDER_ID'] ?? ''
  const ipnTypeName = body['IPN_TYPE_NAME'] ?? ''
  console.log('[paypro-webhook] IPN received and verified:', ipnTypeName, 'orderId:', orderId, 'testMode:', ipnTestMode)
  if (ipnTestMode !== isSandboxMode()) {
    // Silently 200 — don't 401 (PayPro would retry) but don't process either
    console.warn('[paypro-webhook] TEST_MODE mismatch: ipn=%s server=%s', ipnTestMode, isSandboxMode())
    return new Response('OK', { status: 200 })
  }

  // Step 3: Idempotent insert to payment_events using ON CONFLICT DO NOTHING
  const supabase = createServiceClient()

  const payload = parseIpnPayload(body)
  const { userId } = payload

  const { data: insertedRow, error: insertError } = await supabase
    .from('payment_events')
    .upsert(
      {
        provider: 'payproglobal',
        external_event_id: orderId,
        event_type: ipnTypeName,
        user_id: userId,
        payload_json: body,
        processing_status: 'pending',
      },
      { onConflict: 'provider,external_event_id,event_type', ignoreDuplicates: true }
    )
    .select('id')
    .maybeSingle()

  if (insertError) {
    console.error('[paypro-webhook] Failed to insert payment_event:', insertError)
    return new Response('Internal error', { status: 500 })
  }

  // insertedRow is null when ON CONFLICT was triggered (duplicate)
  if (!insertedRow) {
    return new Response('Already processed', { status: 200 })
  }

  const eventId = insertedRow.id

  // Step 4: Check userId — skip events without a traceable user
  if (!userId) {
    await supabase
      .from('payment_events')
      .update({ processing_status: 'skipped' })
      .eq('id', eventId)
    return new Response('OK', { status: 200 })
  }

  // Step 5: Call handler
  try {
    await handlePayProEvent(payload)
    await supabase
      .from('payment_events')
      .update({ processing_status: 'ok', processed_at: new Date().toISOString() })
      .eq('id', eventId)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    console.error('[paypro-webhook] Handler error:', message)
    await supabase
      .from('payment_events')
      .update({ processing_status: 'error', error_message: message })
      .eq('id', eventId)
    // Return 200 to prevent PayPro retry storm for application-level errors.
    // Transient infra errors (DB down) would not reach this path — they'd throw before.
  }

  return new Response('OK', { status: 200 })
}
