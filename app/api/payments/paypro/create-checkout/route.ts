export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase'
import { createCheckoutUrl } from '@/lib/payments/paypro/checkout'
import type { PayProPlanId } from '@/lib/payments/paypro/config'

const VALID_PLAN_IDS: PayProPlanId[] = ['pro_monthly', 'pro_yearly']

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let planId: string
  try {
    const body = await request.json()
    planId = body.planId
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!VALID_PLAN_IDS.includes(planId as PayProPlanId)) {
    return Response.json({ error: 'Invalid plan ID' }, { status: 400 })
  }

  try {
    const firstName = user.user_metadata?.full_name?.split(' ')[0] as string | undefined
    const url = createCheckoutUrl(planId as PayProPlanId, {
      id: user.id,
      email: user.email!,
      firstName,
    })
    return Response.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create checkout URL'
    return Response.json({ error: message }, { status: 500 })
  }
}
