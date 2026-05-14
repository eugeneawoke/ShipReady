import type { PayProIpnPayload } from './mapper'
import { getPlanByProductId, PAYPRO_PROVIDER } from './config'
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
  isTrialConversion?: boolean
}

async function upsertSubscription(
  payload: PayProIpnPayload,
  options: UpsertOptions,
): Promise<void> {
  const { status, isNewOrder = false, isRenewal = false, isTrialConversion = false } = options

  if (!payload.userId) {
    throw new Error('Missing user ID in IPN payload')
  }

  // Reject unknown products — never silently upgrade to a default plan.
  const plan = getPlanByProductId(payload.productId)
  if (!plan) {
    throw new Error(`Unknown PayPro productId "${payload.productId}" — cannot determine plan tier`)
  }

  const supabase = createServiceClient()

  const baseRow: Record<string, unknown> = {
    user_id: payload.userId,
    provider: PAYPRO_PROVIDER,
    plan_id: plan.id,
    billing_interval: plan.interval,
    status,
    updated_at: new Date().toISOString(),
  }

  if (isNewOrder) {
    baseRow.external_subscription_id = payload.subscriptionId
    baseRow.external_order_id = payload.orderId
    baseRow.external_customer_id = payload.customerId
    baseRow.external_product_id = payload.productId
    baseRow.current_period_start = new Date().toISOString()
    if (payload.subscriptionNextChargeDate) {
      baseRow.current_period_end = payload.subscriptionNextChargeDate.toISOString()
    }
    if (isTrialConversion) {
      baseRow.trial_end = new Date().toISOString()
    }
  } else if (isRenewal) {
    // Renewals: extend period_end and update plan_id/billing_interval in case plan changed.
    // Do NOT overwrite period_start, external_order_id, or external_customer_id.
    baseRow.current_period_end = payload.subscriptionNextChargeDate
      ? payload.subscriptionNextChargeDate.toISOString()
      : undefined
  } else {
    // Status-only update (payment_failed, suspended, terminated, refunded, chargedback).
    // plan_id and billing_interval are already in baseRow to keep them consistent.
  }

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
    // OrderCharged → new subscription
    case 1:
      await upsertSubscription(payload, { status: 'active', isNewOrder: true })
      break

    // TrialCharge → trial converted to paid; mark trial_end for analytics
    case 13:
      await upsertSubscription(payload, { status: 'active', isNewOrder: true, isTrialConversion: true })
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

    // Log-only: OrderPartiallyRefunded(5), TrialStart(14), SubscriptionCreated(15), SubscriptionPaymentInfoChanged(21)
    case 5:
    case 14:
    case 15:
    case 21:
      console.log(`[paypro] IPN type ${ipnTypeId} (${ipnTypeName}) — log only, no DB write`)
      break

    default:
      console.warn(`[paypro] Unknown IPN type ID ${ipnTypeId} (${ipnTypeName}) — no DB write`)
  }
}
