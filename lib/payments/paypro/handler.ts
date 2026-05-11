import type { PayProIpnPayload } from './mapper'
import { getPlanByProductId } from './config'
import { createServiceClient } from '@/lib/supabase'

type SubscriptionStatus =
  | 'active'
  | 'payment_failed'
  | 'suspended'
  | 'terminated'
  | 'finished'
  | 'refunded'
  | 'chargedback'

interface UpsertOptions {
  status: SubscriptionStatus
  isNewOrder?: boolean
  isRenewal?: boolean
}

async function upsertSubscription(
  payload: PayProIpnPayload,
  options: UpsertOptions,
): Promise<void> {
  const { status, isNewOrder = false, isRenewal = false } = options

  if (!payload.userId) {
    throw new Error('Missing user ID in IPN payload')
  }

  const plan = getPlanByProductId(payload.productId)
  if (!plan) {
    console.warn(
      `[paypro] Unknown productId "${payload.productId}" — falling back to pro_monthly`,
    )
  }
  const planId = plan?.id ?? 'pro_monthly'
  const billingInterval = plan?.interval ?? 'monthly'

  const supabase = createServiceClient()

  const baseRow: Record<string, unknown> = {
    user_id: payload.userId,
    provider: 'paypro',
    plan_id: planId,
    billing_interval: billingInterval,
    status,
    updated_at: new Date().toISOString(),
  }

  if (isNewOrder) {
    // Full upsert for new orders and trials
    baseRow.external_subscription_id = payload.subscriptionId
    baseRow.external_order_id = payload.orderId
    baseRow.external_customer_id = payload.customerId
    baseRow.external_product_id = payload.productId
    baseRow.current_period_start = new Date().toISOString()
    if (payload.subscriptionNextChargeDate) {
      baseRow.current_period_end = payload.subscriptionNextChargeDate.toISOString()
    }
  } else if (isRenewal) {
    // Renewals: only update status and period_end — don't overwrite period_start or order_id
    baseRow.current_period_end = payload.subscriptionNextChargeDate
      ? payload.subscriptionNextChargeDate.toISOString()
      : undefined
    // Remove keys we don't want to overwrite
    delete baseRow.billing_interval
  } else if (status === 'active') {
    // Charge succeed / renewed (non-initial)
    baseRow.external_subscription_id = payload.subscriptionId
    baseRow.external_order_id = payload.orderId
    baseRow.external_customer_id = payload.customerId
    baseRow.external_product_id = payload.productId
    if (payload.subscriptionNextChargeDate) {
      baseRow.current_period_end = payload.subscriptionNextChargeDate.toISOString()
    }
  }

  // Remove undefined values so Supabase doesn't try to set them
  const row = Object.fromEntries(
    Object.entries(baseRow).filter(([, v]) => v !== undefined),
  )

  const { error } = await supabase
    .from('subscriptions')
    .upsert(row, { onConflict: 'user_id,provider' })

  if (error) {
    throw new Error(`[paypro] Supabase upsert failed: ${error.message}`)
  }
}

export async function handlePayProEvent(payload: PayProIpnPayload): Promise<void> {
  const { ipnTypeId, ipnTypeName } = payload

  switch (ipnTypeId) {
    // OrderCharged, TrialCharge → new subscription
    case 1:
    case 13:
      await upsertSubscription(payload, { status: 'active', isNewOrder: true })
      break

    // SubscriptionChargeSucceed, SubscriptionRenewed → renewal
    case 6:
    case 9:
      await upsertSubscription(payload, { status: 'active', isRenewal: true })
      break

    // SubscriptionChargeFailed, OrderDeclined
    case 7:
    case 4:
      await upsertSubscription(payload, { status: 'payment_failed' })
      break

    // SubscriptionSuspended
    case 8:
      await upsertSubscription(payload, { status: 'suspended' })
      break

    // SubscriptionTerminated
    case 10:
      await upsertSubscription(payload, { status: 'terminated' })
      break

    // SubscriptionFinished
    case 11:
      await upsertSubscription(payload, { status: 'finished' })
      break

    // OrderRefunded
    case 2:
      await upsertSubscription(payload, { status: 'refunded' })
      break

    // OrderChargedBack
    case 3:
      await upsertSubscription(payload, { status: 'chargedback' })
      break

    // Log-only events: OrderPending(5), TrialStart(14), SubscriptionCreated(15), SubscriptionUpdated(21)
    case 5:
    case 14:
    case 15:
    case 21:
      console.log(`[paypro] IPN type ${ipnTypeId} (${ipnTypeName}) — log only, no DB write`)
      break

    default:
      console.warn(
        `[paypro] Unknown IPN type ID ${ipnTypeId} (${ipnTypeName}) — no DB write`,
      )
  }
}
