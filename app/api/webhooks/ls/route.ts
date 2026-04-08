import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import crypto from 'crypto'

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) return false
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')

  if (!signature || signature.length !== digest.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  if (!verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: Record<string, unknown>
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const meta = event.meta as Record<string, unknown> | undefined
  const data = event.data as Record<string, unknown> | undefined
  const attrs = data?.attributes as Record<string, unknown> | undefined

  const eventName: string = typeof meta?.event_name === 'string' ? meta.event_name : ''
  const userId: string = typeof (meta?.custom_data as Record<string, unknown> | undefined)?.user_id === 'string'
    ? (meta!.custom_data as Record<string, unknown>).user_id as string
    : ''
  const customerId: string = attrs?.customer_id?.toString() ?? ''
  const subscriptionId: string = data?.id?.toString() ?? ''
  const variantName: string = typeof attrs?.variant_name === 'string' ? attrs.variant_name.toLowerCase() : ''

  // Validate userId is a proper UUID to prevent injection or account confusion
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!userId || !UUID_RE.test(userId)) return NextResponse.json({ ok: true })

  const supabase = createServiceClient()

  if (eventName === 'subscription_created' || eventName === 'subscription_updated') {
    const plan = variantName.includes('agency') ? 'agency' : 'pro'
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        plan,
        ls_customer_id: customerId,
        ls_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
  }

  if (eventName === 'subscription_cancelled' || eventName === 'subscription_expired') {
    await supabase
      .from('profiles')
      .update({ plan: 'free', updated_at: new Date().toISOString() })
      .eq('id', userId)
  }

  return NextResponse.json({ ok: true })
}
