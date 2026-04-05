import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase'
import crypto from 'crypto'

async function verifySignature(payload: string, signature: string): Promise<boolean> {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET
  if (!secret) return false
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: NextRequest) {
  const payload = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  if (!await verifySignature(payload, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(payload)
  const eventName: string = event.meta?.event_name ?? ''
  const userId: string = event.meta?.custom_data?.user_id ?? ''
  const customerId: string = event.data?.attributes?.customer_id?.toString() ?? ''
  const subscriptionId: string = event.data?.id?.toString() ?? ''
  const variantName: string = event.data?.attributes?.variant_name?.toLowerCase() ?? ''

  if (!userId) return NextResponse.json({ ok: true })

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
