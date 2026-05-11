export const runtime = 'nodejs'

import { verifyIpnRequest } from '@/lib/payments/paypro/signature'
import { parseIpnPayload } from '@/lib/payments/paypro/mapper'
import { handlePayProEvent } from '@/lib/payments/paypro/handler'
import { createServiceClient } from '@/lib/supabase'

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

  // Step 3: Idempotent insert to payment_events
  const supabase = createServiceClient()
  const orderId = body['ORDER_ID'] ?? ''
  const ipnTypeName = body['IPN_TYPE_NAME'] ?? ''

  // Parse userId for the insert (may be null)
  const parsedForUserId = parseIpnPayload(body)
  const userId = parsedForUserId.userId

  const { data: insertedRow, error: insertError } = await supabase
    .from('payment_events')
    .insert({
      provider: 'payproglobal',
      external_event_id: orderId,
      event_type: ipnTypeName,
      user_id: userId,
      payload_json: body,
      processing_status: 'pending',
    })
    .select('id')
    .single()

  // Duplicate detected: PGRST116 = no rows returned (conflict DO NOTHING), or data is null
  if (insertError?.code === 'PGRST116' || (!insertedRow && !insertError)) {
    return new Response('Already processed', { status: 200 })
  }

  const eventId = insertedRow?.id

  // Step 4: Check userId
  if (!userId) {
    if (eventId) {
      await supabase
        .from('payment_events')
        .update({ processing_status: 'skipped' })
        .eq('id', eventId)
    }
    return new Response('OK', { status: 200 })
  }

  // Step 5: Call handler
  const parsedPayload = parsedForUserId
  try {
    await handlePayProEvent(parsedPayload)
    if (eventId) {
      await supabase
        .from('payment_events')
        .update({ processing_status: 'ok', processed_at: new Date().toISOString() })
        .eq('id', eventId)
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    if (eventId) {
      await supabase
        .from('payment_events')
        .update({ processing_status: 'error', error_message: message })
        .eq('id', eventId)
    }
    // Always return 200 for valid payloads to prevent PayPro retries
    return new Response('OK', { status: 200 })
  }

  // Step 6: Return 200
  return new Response('OK', { status: 200 })
}
