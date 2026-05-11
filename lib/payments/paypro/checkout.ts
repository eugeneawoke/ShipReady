import { CHECKOUT_BASE, PAYPRO_PLANS, isSandboxMode } from './config'
import type { PayProPlanId } from './config'

export function createCheckoutUrl(
  planId: PayProPlanId,
  user: { id: string; email: string; firstName?: string }
): string {
  const plan = PAYPRO_PLANS[planId]

  if (!plan.productId) {
    throw new Error(`PayPro product ID not configured for plan: ${planId}`)
  }

  const params = new URLSearchParams()
  params.set('products[1][id]', plan.productId)
  params.set('products[1][qty]', '1')
  params.set('billing-email', user.email)
  if (user.firstName) {
    params.set('billing-first-name', user.firstName)
  }
  params.set('x-user-id', user.id)
  params.set('enable-auto-renewal', 'true')

  if (isSandboxMode()) {
    params.set('use-test-mode', 'true')
    const secretKey = process.env.PAYPRO_SECRET_KEY ?? ''
    if (secretKey) {
      params.set('secret-key', secretKey)
    }
  }

  return `${CHECKOUT_BASE}?${params.toString()}`
}
