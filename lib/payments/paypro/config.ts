// Centralized PayPro Global plan configuration
// Product IDs come from env vars set in PayPro dashboard

export const CHECKOUT_BASE = 'https://store.payproglobal.com/checkout'
export const PAYPRO_API_BASE = 'https://store.payproglobal.com/api'

export interface PayProPlan {
  id: string
  productId: string
  interval: 'monthly' | 'yearly'
  planTier: 'pro' | 'agency'
  amount: number
  currency: string
}

export const PAYPRO_PLANS = {
  pro_monthly: {
    id: 'pro_monthly',
    productId: process.env.PAYPRO_PRODUCT_PRO_MONTHLY ?? '',
    interval: 'monthly' as const,
    planTier: 'pro' as const,
    amount: 14,
    currency: 'USD',
  },
  pro_yearly: {
    id: 'pro_yearly',
    productId: process.env.PAYPRO_PRODUCT_PRO_YEARLY ?? '',
    interval: 'yearly' as const,
    planTier: 'pro' as const,
    amount: 140,
    currency: 'USD',
  },
} satisfies Record<string, PayProPlan>

export type PayProPlanId = keyof typeof PAYPRO_PLANS

export function getPlanByProductId(productId: string): PayProPlan | null {
  return Object.values(PAYPRO_PLANS).find((p) => p.productId === productId) ?? null
}

export function isSandboxMode(): boolean {
  return process.env.PAYPRO_SANDBOX === 'true'
}
